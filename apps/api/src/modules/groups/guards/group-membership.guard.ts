import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { canViewGroupContent, membershipSatisfies } from '@sentio/core';
import { Types } from 'mongoose';
import { Errors } from '../../../common/errors/app-error';
import { type AppRequest, getRequest } from '../../../common/graphql/context';
import { GROUP_ROLE_KEY, type GroupRoleMetadata } from '../decorators/group-role.constants';
import { type GroupMember } from '../schemas/group-member.schema';
import { GroupsService } from '../groups.service';

export type RequestWithMembership = AppRequest & { groupMembership?: GroupMember };

/**
 * Verifica que el usuario autenticado tenga una membresía activa con el rol mínimo exigido.
 * Se ejecuta después del GqlAuthGuard global.
 *
 * - NOT_FOUND si el grupo no existe o el usuario no puede ver su contenido (grupo no público
 *   sin membresía activa, o usuario baneado): la respuesta es idéntica a la de un grupo
 *   inexistente, así no se revela que existe.
 * - FORBIDDEN_GROUP solo si el usuario sí puede ver el grupo pero no alcanza el rol
 *   (miembro activo con rol insuficiente, o no miembro de un grupo público).
 *
 * Deja la membresía en `req.groupMembership` para que el resolver no tenga que volver a leerla.
 */
@Injectable()
export class GroupMembershipGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly groups: GroupsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.getAllAndOverride<GroupRoleMetadata | undefined>(GROUP_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? { role: 'member', groupIdArg: 'groupId' };

    const req = getRequest(context) as RequestWithMembership;
    if (!req.user) throw Errors.unauthenticated();

    const args = GqlExecutionContext.create(context).getArgs<Record<string, unknown>>();
    const groupId = readPath(args, meta.groupIdArg);
    if (typeof groupId !== 'string' || !Types.ObjectId.isValid(groupId)) {
      throw Errors.badInput(`Falta un "${meta.groupIdArg}" válido.`);
    }

    const [group, membership] = await Promise.all([
      this.groups.findById(groupId),
      this.groups.findMembership(groupId, req.user.userId),
    ]);
    if (!group || !canViewGroupContent(group.visibility, membership)) {
      throw Errors.notFound('Grupo');
    }
    if (!membershipSatisfies(membership, meta.role)) {
      throw Errors.forbiddenGroup(groupId);
    }
    req.groupMembership = membership ?? undefined;
    return true;
  }
}

function readPath(source: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (value && typeof value === 'object') return (value as Record<string, unknown>)[key];
    return undefined;
  }, source);
}

import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { membershipSatisfies } from '@sentio/core';
import { Types } from 'mongoose';
import { Errors } from '../../../common/errors/app-error';
import { type AppRequest, getRequest } from '../../../common/graphql/context';
import { GROUP_ROLE_KEY, type GroupRoleMetadata } from '../decorators/group-role.constants';
import { type GroupMember } from '../schemas/group-member.schema';
import { GroupsService } from '../groups.service';

export type RequestWithMembership = AppRequest & { groupMembership?: GroupMember };

/**
 * Verifica que el usuario autenticado tenga una membresía activa con el rol mínimo exigido.
 * Se ejecuta después del GqlAuthGuard global. Responde FORBIDDEN_GROUP si no cumple.
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

    const membership = await this.groups.findMembership(groupId, req.user.userId);
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

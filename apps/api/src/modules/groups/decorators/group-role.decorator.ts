import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { type GroupRole as GroupRoleName } from '@sentio/core';
import { GroupMembershipGuard } from '../guards/group-membership.guard';
import { GROUP_ROLE_KEY, type GroupRoleMetadata } from './group-role.constants';

export interface GroupRoleOptions {
  /** Ruta del argumento GraphQL con el id del grupo. Por defecto "groupId". */
  groupIdArg?: string;
}

/**
 * Exige una membresía activa con al menos `role` en el grupo indicado por los argumentos.
 * Ejemplo: `@GroupRole('moderator', { groupIdArg: 'input.groupId' })`.
 */
export const GroupRole = (role: GroupRoleName = 'member', options: GroupRoleOptions = {}) =>
  applyDecorators(
    SetMetadata(GROUP_ROLE_KEY, {
      role,
      groupIdArg: options.groupIdArg ?? 'groupId',
    } satisfies GroupRoleMetadata),
    UseGuards(GroupMembershipGuard),
  );

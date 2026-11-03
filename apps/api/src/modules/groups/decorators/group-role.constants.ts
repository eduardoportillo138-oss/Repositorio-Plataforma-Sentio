import { type GroupRole } from '@sentio/core';

export const GROUP_ROLE_KEY = 'groups:minimumRole';

export interface GroupRoleMetadata {
  role: GroupRole;
  /** Ruta del argumento con el id del grupo, p. ej. "groupId" o "input.groupId". */
  groupIdArg: string;
}

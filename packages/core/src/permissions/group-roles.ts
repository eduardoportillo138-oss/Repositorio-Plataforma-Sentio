export const GroupRole = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  MEMBER: 'member',
} as const;
export type GroupRole = (typeof GroupRole)[keyof typeof GroupRole];

export const MembershipStatus = {
  ACTIVE: 'active',
  PENDING: 'pending',
  BANNED: 'banned',
} as const;
export type MembershipStatus = (typeof MembershipStatus)[keyof typeof MembershipStatus];

export const GroupVisibility = {
  PUBLIC: 'public',
  PRIVATE: 'private',
} as const;
export type GroupVisibility = (typeof GroupVisibility)[keyof typeof GroupVisibility];

const ROLE_RANK: Record<GroupRole, number> = {
  owner: 40,
  admin: 30,
  moderator: 20,
  member: 10,
};

export interface Membership {
  role: GroupRole;
  status: MembershipStatus;
}

/** `true` si el rol es igual o superior al mínimo requerido. */
export function hasMinimumRole(role: GroupRole, minimum: GroupRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

/** Solo cuentan las membresías activas; pending y banned no otorgan permisos. */
export function membershipSatisfies(
  membership: Membership | null | undefined,
  minimum: GroupRole,
): boolean {
  return membership?.status === MembershipStatus.ACTIVE && hasMinimumRole(membership.role, minimum);
}

/** Un actor solo puede gestionar (cambiar rol, banear) a miembros de rango estrictamente menor. */
export function canManageMember(actor: Membership, target: Membership): boolean {
  return actor.status === MembershipStatus.ACTIVE && ROLE_RANK[actor.role] > ROLE_RANK[target.role];
}

/** Un actor puede asignar roles estrictamente inferiores al suyo (el owner se transfiere aparte). */
export function canAssignRole(actor: Membership, role: GroupRole): boolean {
  return (
    actor.status === MembershipStatus.ACTIVE &&
    role !== GroupRole.OWNER &&
    ROLE_RANK[actor.role] > ROLE_RANK[role]
  );
}

/** Contenido de grupos privados: solo miembros activos. Públicos: cualquiera salvo baneados. */
export function canViewGroupContent(
  visibility: GroupVisibility,
  membership: Membership | null | undefined,
): boolean {
  if (membership?.status === MembershipStatus.BANNED) return false;
  if (visibility === GroupVisibility.PUBLIC) return true;
  return membership?.status === MembershipStatus.ACTIVE;
}

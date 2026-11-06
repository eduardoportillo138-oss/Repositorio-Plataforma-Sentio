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

/**
 * - PUBLIC: cualquiera lo encuentra y ve su contenido.
 * - PRIVATE: cualquiera lo encuentra (nombre y descripción en búsquedas), pero solo los
 *   miembros activos ven su contenido.
 * - SECRET: solo sus miembros activos saben que existe. Solo se entra por invitación.
 */
export const GroupVisibility = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  SECRET: 'secret',
} as const;
export type GroupVisibility = (typeof GroupVisibility)[keyof typeof GroupVisibility];

/**
 * Cómo se entra a un grupo:
 * - INVITE_ONLY: solo por invitación de un miembro con permiso.
 * - REQUEST: el usuario lo solicita (membresía pending) y un moderador la aprueba.
 * - OPEN: el usuario entra directamente.
 */
export const JoinPolicy = {
  INVITE_ONLY: 'invite_only',
  REQUEST: 'request',
  OPEN: 'open',
} as const;
export type JoinPolicy = (typeof JoinPolicy)[keyof typeof JoinPolicy];

const DEFAULT_JOIN_POLICY: Record<GroupVisibility, JoinPolicy> = {
  public: JoinPolicy.OPEN,
  private: JoinPolicy.REQUEST,
  secret: JoinPolicy.INVITE_ONLY,
};

/** Políticas admitidas por visibilidad: un grupo secreto no puede aceptar solicitudes. */
const ALLOWED_JOIN_POLICIES: Record<GroupVisibility, readonly JoinPolicy[]> = {
  public: [JoinPolicy.OPEN, JoinPolicy.REQUEST, JoinPolicy.INVITE_ONLY],
  private: [JoinPolicy.REQUEST, JoinPolicy.INVITE_ONLY, JoinPolicy.OPEN],
  secret: [JoinPolicy.INVITE_ONLY],
};

/** Política por defecto: OPEN si es PUBLIC, REQUEST si es PRIVATE, INVITE_ONLY si es SECRET. */
export function defaultJoinPolicy(visibility: GroupVisibility): JoinPolicy {
  return DEFAULT_JOIN_POLICY[visibility];
}

export function isJoinPolicyAllowed(visibility: GroupVisibility, policy: JoinPolicy): boolean {
  return ALLOWED_JOIN_POLICIES[visibility].includes(policy);
}

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

/**
 * Contenido del grupo (publicaciones, miembros, detalle):
 * - Los baneados nunca ven nada, sea cual sea la visibilidad.
 * - PUBLIC: cualquiera.
 * - PRIVATE y SECRET: solo miembros activos (pending no cuenta).
 */
export function canViewGroupContent(
  visibility: GroupVisibility,
  membership: Membership | null | undefined,
): boolean {
  if (membership?.status === MembershipStatus.BANNED) return false;
  if (visibility === GroupVisibility.PUBLIC) return true;
  return membership?.status === MembershipStatus.ACTIVE;
}

/**
 * Si el grupo puede aparecer en búsquedas, listados o sugerencias para este usuario:
 * - Los baneados no vuelven a encontrar el grupo del que los banearon.
 * - PUBLIC y PRIVATE: cualquiera.
 * - SECRET: solo sus miembros activos.
 */
export function canDiscoverGroup(
  visibility: GroupVisibility,
  membership: Membership | null | undefined,
): boolean {
  if (membership?.status === MembershipStatus.BANNED) return false;
  if (visibility === GroupVisibility.SECRET) return membership?.status === MembershipStatus.ACTIVE;
  return true;
}

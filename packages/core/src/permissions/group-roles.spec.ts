import {
  canAssignRole,
  canDiscoverGroup,
  canManageMember,
  canViewGroupContent,
  defaultJoinPolicy,
  GroupRole,
  GroupVisibility,
  hasMinimumRole,
  isJoinPolicyAllowed,
  JoinPolicy,
  type Membership,
  MembershipStatus,
  membershipSatisfies,
} from './group-roles';

describe('group-roles', () => {
  it('respeta la jerarquía owner > admin > moderator > member', () => {
    expect(hasMinimumRole('owner', 'admin')).toBe(true);
    expect(hasMinimumRole('moderator', 'moderator')).toBe(true);
    expect(hasMinimumRole('member', 'moderator')).toBe(false);
  });

  it('ignora membresías pendientes o baneadas', () => {
    expect(membershipSatisfies({ role: 'admin', status: 'pending' }, 'member')).toBe(false);
    expect(membershipSatisfies({ role: 'owner', status: 'banned' }, 'member')).toBe(false);
    expect(membershipSatisfies(null, 'member')).toBe(false);
  });

  it('solo gestiona y asigna rangos inferiores', () => {
    const admin = { role: 'admin', status: 'active' } as const;
    expect(canManageMember(admin, { role: 'moderator', status: 'active' })).toBe(true);
    expect(canManageMember(admin, { role: 'admin', status: 'active' })).toBe(false);
    expect(canAssignRole(admin, 'moderator')).toBe(true);
    expect(canAssignRole(admin, 'owner')).toBe(false);
  });
});

/** Todos los estados de membresía posibles para un usuario frente a un grupo. */
type MembershipCase = 'none' | 'pending' | 'banned' | GroupRole;

const MEMBERSHIP_CASES: MembershipCase[] = [
  'none',
  'pending',
  'banned',
  GroupRole.MEMBER,
  GroupRole.MODERATOR,
  GroupRole.ADMIN,
  GroupRole.OWNER,
];

function membershipFor(kind: MembershipCase): Membership | null {
  if (kind === 'none') return null;
  if (kind === 'pending') return { role: GroupRole.MEMBER, status: MembershipStatus.PENDING };
  // Un baneado puede tener cualquier rol previo; el baneo manda sobre el rol.
  if (kind === 'banned') return { role: GroupRole.ADMIN, status: MembershipStatus.BANNED };
  return { role: kind, status: MembershipStatus.ACTIVE };
}

const isActive = (kind: MembershipCase) => !['none', 'pending', 'banned'].includes(kind);

const VISIBILITIES = Object.values(GroupVisibility);
const MATRIX = VISIBILITIES.flatMap((visibility) =>
  MEMBERSHIP_CASES.map((kind) => ({ visibility, kind })),
);

describe('canViewGroupContent: visibilidad × membresía', () => {
  const expected = (visibility: GroupVisibility, kind: MembershipCase): boolean => {
    if (kind === 'banned') return false;
    if (visibility === GroupVisibility.PUBLIC) return true;
    return isActive(kind);
  };

  it.each(MATRIX)('$visibility / $kind', ({ visibility, kind }) => {
    expect(canViewGroupContent(visibility, membershipFor(kind))).toBe(expected(visibility, kind));
  });

  it('acepta undefined como "sin membresía"', () => {
    expect(canViewGroupContent(GroupVisibility.SECRET, undefined)).toBe(false);
    expect(canViewGroupContent(GroupVisibility.PUBLIC, undefined)).toBe(true);
  });

  it('un baneado no ve nada aunque conserve el rol de owner', () => {
    for (const visibility of VISIBILITIES) {
      expect(
        canViewGroupContent(visibility, { role: 'owner', status: MembershipStatus.BANNED }),
      ).toBe(false);
    }
  });
});

describe('canDiscoverGroup: visibilidad × membresía', () => {
  const expected = (visibility: GroupVisibility, kind: MembershipCase): boolean => {
    if (kind === 'banned') return false;
    if (visibility === GroupVisibility.SECRET) return isActive(kind);
    return true;
  };

  it.each(MATRIX)('$visibility / $kind', ({ visibility, kind }) => {
    expect(canDiscoverGroup(visibility, membershipFor(kind))).toBe(expected(visibility, kind));
  });

  it('PRIVATE se descubre pero su contenido no se ve sin membresía activa', () => {
    for (const kind of ['none', 'pending'] as const) {
      expect(canDiscoverGroup(GroupVisibility.PRIVATE, membershipFor(kind))).toBe(true);
      expect(canViewGroupContent(GroupVisibility.PRIVATE, membershipFor(kind))).toBe(false);
    }
  });

  it('quien no puede descubrir un grupo tampoco puede ver su contenido', () => {
    for (const { visibility, kind } of MATRIX) {
      const membership = membershipFor(kind);
      if (!canDiscoverGroup(visibility, membership)) {
        expect(canViewGroupContent(visibility, membership)).toBe(false);
      }
    }
  });
});

describe('JoinPolicy', () => {
  it('por defecto: PUBLIC → open, PRIVATE → request, SECRET → invite_only', () => {
    expect(defaultJoinPolicy(GroupVisibility.PUBLIC)).toBe(JoinPolicy.OPEN);
    expect(defaultJoinPolicy(GroupVisibility.PRIVATE)).toBe(JoinPolicy.REQUEST);
    expect(defaultJoinPolicy(GroupVisibility.SECRET)).toBe(JoinPolicy.INVITE_ONLY);
  });

  const POLICY_MATRIX = VISIBILITIES.flatMap((visibility) =>
    Object.values(JoinPolicy).map((policy) => ({ visibility, policy })),
  );

  it.each(POLICY_MATRIX)('$visibility admite $policy?', ({ visibility, policy }) => {
    const allowed = visibility !== GroupVisibility.SECRET || policy === JoinPolicy.INVITE_ONLY;
    expect(isJoinPolicyAllowed(visibility, policy)).toBe(allowed);
  });

  it('la política por defecto siempre es admitida', () => {
    for (const visibility of VISIBILITIES) {
      expect(isJoinPolicyAllowed(visibility, defaultJoinPolicy(visibility))).toBe(true);
    }
  });
});

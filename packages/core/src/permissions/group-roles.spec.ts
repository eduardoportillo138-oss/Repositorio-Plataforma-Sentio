import {
  canAssignRole,
  canManageMember,
  canViewGroupContent,
  hasMinimumRole,
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

  it('oculta grupos privados a no miembros', () => {
    expect(canViewGroupContent('private', null)).toBe(false);
    expect(canViewGroupContent('private', { role: 'member', status: 'active' })).toBe(true);
    expect(canViewGroupContent('public', null)).toBe(true);
    expect(canViewGroupContent('public', { role: 'member', status: 'banned' })).toBe(false);
  });
});

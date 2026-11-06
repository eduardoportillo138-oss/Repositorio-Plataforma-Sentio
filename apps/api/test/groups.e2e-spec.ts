import { getModelToken } from '@nestjs/mongoose';
import { ErrorCode, GroupRole, GroupVisibility, JoinPolicy, MembershipStatus } from '@sentio/core';
import { type Model, Types } from 'mongoose';
import { GroupMember } from '../src/modules/groups/schemas/group-member.schema';
import { Group } from '../src/modules/groups/schemas/group.schema';
import { createTestApp, type GqlResult, type TestApp } from './utils/test-app';

/**
 * Matriz de permisos de grupos: 7 tipos de usuario × 3 visibilidades × {group, groupMembers}.
 *
 * Las expectativas están escritas a mano (no se derivan de @sentio/core) para que un cambio
 * accidental en las reglas de permisos haga fallar esta prueba.
 */

type Actor = 'owner' | 'admin' | 'moderator' | 'member' | 'pending' | 'banned' | 'stranger';
type Visibility = 'public' | 'private' | 'secret';

/** `group(id)`: devuelve el grupo o `null` (nunca un error). */
type GroupOutcome = 'data' | 'null';
/** `groupMembers(groupId)`: devuelve la lista o uno de estos códigos de error. */
type MembersOutcome = 'data' | typeof ErrorCode.NOT_FOUND | typeof ErrorCode.FORBIDDEN_GROUP;

const ACTORS: Actor[] = ['owner', 'admin', 'moderator', 'member', 'pending', 'banned', 'stranger'];
const VISIBILITIES: Visibility[] = ['public', 'private', 'secret'];
const NF = ErrorCode.NOT_FOUND;
const FG = ErrorCode.FORBIDDEN_GROUP;

const EXPECTED_GROUP: Record<Visibility, Record<Actor, GroupOutcome>> = {
  public: {
    owner: 'data',
    admin: 'data',
    moderator: 'data',
    member: 'data',
    pending: 'data',
    banned: 'null',
    stranger: 'data',
  },
  private: {
    owner: 'data',
    admin: 'data',
    moderator: 'data',
    member: 'data',
    pending: 'null',
    banned: 'null',
    stranger: 'null',
  },
  secret: {
    owner: 'data',
    admin: 'data',
    moderator: 'data',
    member: 'data',
    pending: 'null',
    banned: 'null',
    stranger: 'null',
  },
};

const EXPECTED_MEMBERS: Record<Visibility, Record<Actor, MembersOutcome>> = {
  // En un grupo público su existencia no es secreta: quien no es miembro recibe FORBIDDEN_GROUP.
  public: {
    owner: 'data',
    admin: 'data',
    moderator: 'data',
    member: 'data',
    pending: FG,
    banned: NF,
    stranger: FG,
  },
  // En privados y secretos, quien no es miembro activo no distingue el grupo de uno inexistente.
  private: {
    owner: 'data',
    admin: 'data',
    moderator: 'data',
    member: 'data',
    pending: NF,
    banned: NF,
    stranger: NF,
  },
  secret: {
    owner: 'data',
    admin: 'data',
    moderator: 'data',
    member: 'data',
    pending: NF,
    banned: NF,
    stranger: NF,
  },
};

const REGISTER = `mutation Register($input: RegisterInput!) { register(input: $input) { accessToken user { id } } }`;
const CREATE_GROUP = `mutation($input: CreateGroupInput!) {
  createGroup(input: $input) { id visibility joinPolicy }
}`;
const GROUP = `query($id: ID!) {
  group(id: $id) {
    id name visibility joinPolicy
    viewerMembership { role status }
  }
}`;
const MEMBERS = `query($groupId: ID!) {
  groupMembers(groupId: $groupId, first: 50) {
    edges { node { role status user { handle } } }
  }
}`;

const MISSING_GROUP_ID = new Types.ObjectId().toHexString();

interface GroupData {
  group: {
    id: string;
    name: string;
    visibility: string;
    joinPolicy: string;
    viewerMembership: { role: string; status: string } | null;
  } | null;
}

interface MembersData {
  groupMembers: { edges: { node: { role: string; status: string; user: { handle: string } } }[] };
}

const handleOf = (actor: Actor) => `gm_${actor}`;

function code(result: GqlResult<unknown>): string | undefined {
  return result.errors?.[0]?.extensions?.code;
}

let t: TestApp;
const tokens = {} as Record<Actor, string>;
const userIds = {} as Record<Actor, string>;
const groupIds = {} as Record<Visibility, string>;

beforeAll(async () => {
  t = await createTestApp();

  for (const actor of ACTORS) {
    const res = await t.gql<{ register: { accessToken: string; user: { id: string } } }>(REGISTER, {
      input: {
        email: `${handleOf(actor)}@example.com`,
        password: 'contrasena123',
        handle: handleOf(actor),
        displayName: actor,
        acceptPrivacyNotice: true,
      },
    });
    expect(res.errors).toBeUndefined();
    tokens[actor] = res.data!.register.accessToken;
    userIds[actor] = res.data!.register.user.id;
  }

  for (const visibility of VISIBILITIES) {
    const res = await t.gql<{ createGroup: { id: string } }>(
      CREATE_GROUP,
      { input: { name: `Grupo ${visibility}`, visibility: visibility.toUpperCase() } },
      { token: tokens.owner },
    );
    expect(res.errors).toBeUndefined();
    groupIds[visibility] = res.data!.createGroup.id;
  }

  // Aún no hay mutaciones de invitación, solicitud ni baneo: las membresías se siembran directo.
  const members = t.app.get<Model<GroupMember>>(getModelToken(GroupMember.name));
  const seeded: { actor: Actor; role: GroupRole; status: MembershipStatus }[] = [
    { actor: 'admin', role: GroupRole.ADMIN, status: MembershipStatus.ACTIVE },
    { actor: 'moderator', role: GroupRole.MODERATOR, status: MembershipStatus.ACTIVE },
    { actor: 'member', role: GroupRole.MEMBER, status: MembershipStatus.ACTIVE },
    { actor: 'pending', role: GroupRole.MEMBER, status: MembershipStatus.PENDING },
    // Un baneado con rol alto prueba que el baneo manda sobre el rol.
    { actor: 'banned', role: GroupRole.ADMIN, status: MembershipStatus.BANNED },
  ];
  await members.insertMany(
    VISIBILITIES.flatMap((visibility) =>
      seeded.map(({ actor, role, status }) => ({
        groupId: new Types.ObjectId(groupIds[visibility]),
        userId: new Types.ObjectId(userIds[actor]),
        role,
        status,
        joinedAt: status === MembershipStatus.ACTIVE ? new Date() : null,
        bannedAt: status === MembershipStatus.BANNED ? new Date() : null,
      })),
    ),
  );
});

afterAll(async () => {
  await t?.close();
});

const CASES = VISIBILITIES.flatMap((visibility) =>
  ACTORS.map((actor) => ({
    visibility,
    actor,
    group: EXPECTED_GROUP[visibility][actor],
    members: EXPECTED_MEMBERS[visibility][actor],
  })),
);

describe('Groups (integración): matriz de permisos', () => {
  describe('group(id)', () => {
    it.each(CASES)('$actor en grupo $visibility → $group', async ({ visibility, actor, group }) => {
      const res = await t.gql<GroupData>(
        GROUP,
        { id: groupIds[visibility] },
        { token: tokens[actor] },
      );
      expect(res.errors).toBeUndefined();

      if (group === 'null') {
        expect(res.data).toEqual({ group: null });
        return;
      }
      expect(res.data!.group).toMatchObject({
        id: groupIds[visibility],
        visibility: visibility.toUpperCase(),
      });
      const isActiveMember = !['pending', 'banned', 'stranger'].includes(actor);
      if (isActiveMember) {
        expect(res.data!.group!.viewerMembership).toEqual({
          role: actor.toUpperCase(),
          status: 'ACTIVE',
        });
      }
    });

    it('un id inexistente o inválido devuelve null, igual que un grupo oculto', async () => {
      for (const id of [MISSING_GROUP_ID, 'no-es-un-id']) {
        const res = await t.gql<GroupData>(GROUP, { id }, { token: tokens.stranger });
        expect(res.errors).toBeUndefined();
        expect(res.data).toEqual({ group: null });
      }
    });
  });

  describe('groupMembers(groupId)', () => {
    it.each(CASES)(
      '$actor en grupo $visibility → $members',
      async ({ visibility, actor, members }) => {
        const res = await t.gql<MembersData>(
          MEMBERS,
          { groupId: groupIds[visibility] },
          { token: tokens[actor] },
        );

        if (members !== 'data') {
          expect(code(res)).toBe(members);
          expect(res.data).toBeNull();
          if (members === ErrorCode.NOT_FOUND) {
            // Indistinguible de un grupo que no existe: mismo mensaje, sin groupId.
            const missing = await t.gql(
              MEMBERS,
              { groupId: MISSING_GROUP_ID },
              { token: tokens[actor] },
            );
            expect(res.errors![0]!.message).toBe(missing.errors![0]!.message);
            expect(res.errors![0]!.extensions).not.toHaveProperty('groupId');
          }
          return;
        }

        expect(res.errors).toBeUndefined();
        // Solo se listan miembros activos: ni pending ni banned.
        const listed = res.data!.groupMembers.edges.map((e) => e.node);
        expect(listed.map((n) => n.user.handle).sort()).toEqual(
          ['admin', 'member', 'moderator', 'owner'].map((a) => handleOf(a as Actor)).sort(),
        );
        expect(listed.every((n) => n.status === 'ACTIVE')).toBe(true);
      },
    );

    it('un grupo inexistente responde NOT_FOUND', async () => {
      const res = await t.gql(MEMBERS, { groupId: MISSING_GROUP_ID }, { token: tokens.owner });
      expect(code(res)).toBe(ErrorCode.NOT_FOUND);
    });
  });

  it('ningún no miembro, pending ni banned recibe datos de un grupo privado o secreto', async () => {
    const outsiders: Actor[] = ['stranger', 'pending', 'banned'];
    for (const visibility of ['private', 'secret'] as const) {
      for (const actor of outsiders) {
        const group = await t.gql<GroupData>(
          GROUP,
          { id: groupIds[visibility] },
          { token: tokens[actor] },
        );
        const members = await t.gql<MembersData>(
          MEMBERS,
          { groupId: groupIds[visibility] },
          { token: tokens[actor] },
        );
        const leaked = JSON.stringify([group.data, members.data, group.errors, members.errors]);
        expect(leaked).not.toContain(`Grupo ${visibility}`);
        expect(leaked).not.toContain(groupIds[visibility]);
        expect(leaked).not.toContain(handleOf('owner'));
      }
    }
  });
});

describe('Groups (integración): creación y política de ingreso', () => {
  const create = (input: Record<string, unknown>) =>
    t.gql<{ createGroup: { visibility: string; joinPolicy: string } }>(
      CREATE_GROUP,
      { input: { name: 'Grupo de prueba', ...input } },
      { token: tokens.owner },
    );

  it('aplica la política por defecto según la visibilidad', async () => {
    await expect(create({ visibility: 'SECRET' })).resolves.toMatchObject({
      data: { createGroup: { visibility: 'SECRET', joinPolicy: 'INVITE_ONLY' } },
    });
    await expect(create({})).resolves.toMatchObject({
      data: { createGroup: { visibility: 'PRIVATE', joinPolicy: 'REQUEST' } },
    });
    await expect(create({ visibility: 'PUBLIC' })).resolves.toMatchObject({
      data: { createGroup: { visibility: 'PUBLIC', joinPolicy: 'OPEN' } },
    });
  });

  it('rechaza un grupo secreto que no sea solo por invitación (API y Mongoose)', async () => {
    const invalid = await create({ visibility: 'SECRET', joinPolicy: 'REQUEST' });
    expect(code(invalid)).toBe(ErrorCode.BAD_USER_INPUT);
    expect(invalid.errors?.[0]?.extensions?.fieldErrors).toHaveProperty('joinPolicy');

    const groups = t.app.get<Model<Group>>(getModelToken(Group.name));
    await expect(
      groups.create({
        name: 'Directo',
        slug: `directo-${Date.now()}`,
        visibility: GroupVisibility.SECRET,
        joinPolicy: JoinPolicy.OPEN,
        ownerId: new Types.ObjectId(userIds.owner),
      }),
    ).rejects.toThrow(/invite_only/);
  });
});

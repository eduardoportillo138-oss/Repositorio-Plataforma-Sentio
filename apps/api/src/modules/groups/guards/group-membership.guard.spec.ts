import { type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import {
  ErrorCode,
  type GroupRole,
  GroupVisibility,
  type Membership,
  MembershipStatus,
} from '@sentio/core';
import { Types } from 'mongoose';
import { GROUP_ROLE_KEY, type GroupRoleMetadata } from '../decorators/group-role.constants';
import { type GroupsService } from '../groups.service';
import { GroupMembershipGuard, type RequestWithMembership } from './group-membership.guard';

const groupId = new Types.ObjectId().toHexString();
const userId = new Types.ObjectId().toHexString();

function setup(options: {
  visibility: GroupVisibility | null;
  membership: Membership | null;
  required?: GroupRole;
}) {
  const groups = {
    findById: jest.fn(() =>
      Promise.resolve(options.visibility ? { visibility: options.visibility } : null),
    ),
    findMembership: jest.fn(() => Promise.resolve(options.membership)),
  };
  const reflector = new Reflector();
  jest
    .spyOn(reflector, 'getAllAndOverride')
    .mockImplementation((key: unknown) =>
      key === GROUP_ROLE_KEY
        ? ({
            role: options.required ?? 'member',
            groupIdArg: 'groupId',
          } satisfies GroupRoleMetadata)
        : undefined,
    );

  const req: RequestWithMembership = { user: { userId, sessionId: 's' } } as RequestWithMembership;
  const context = {
    getType: () => 'graphql',
    getHandler: () => () => undefined,
    getClass: () => class {},
  } as unknown as ExecutionContext;
  jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
    getContext: () => ({ req }),
    getArgs: () => ({ groupId }),
  } as unknown as GqlExecutionContext);

  const guard = new GroupMembershipGuard(reflector, groups as unknown as GroupsService);
  return { guard, context, req };
}

const active = (role: GroupRole): Membership => ({ role, status: MembershipStatus.ACTIVE });

async function expectCode(promise: Promise<unknown>, code: string): Promise<void> {
  await expect(promise).rejects.toMatchObject({ extensions: { code } });
}

describe('GroupMembershipGuard', () => {
  afterEach(() => jest.restoreAllMocks());

  it('deja pasar a un miembro activo con el rol suficiente y adjunta la membresía', async () => {
    const membership = active('moderator');
    const { guard, context, req } = setup({
      visibility: GroupVisibility.PRIVATE,
      membership,
      required: 'moderator',
    });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(req.groupMembership).toBe(membership);
  });

  it('FORBIDDEN_GROUP cuando el miembro activo no alcanza el rol', async () => {
    const { guard, context } = setup({
      visibility: GroupVisibility.PRIVATE,
      membership: active('member'),
      required: 'admin',
    });
    await expectCode(guard.canActivate(context), ErrorCode.FORBIDDEN_GROUP);
  });

  it('NOT_FOUND si el grupo no existe', async () => {
    const { guard, context } = setup({ visibility: null, membership: null });
    await expectCode(guard.canActivate(context), ErrorCode.NOT_FOUND);
  });

  it.each([
    ['sin membresía', null],
    ['pending', { role: 'member', status: MembershipStatus.PENDING }],
    ['banned', { role: 'member', status: MembershipStatus.BANNED }],
  ] as const)('grupo privado y usuario %s → NOT_FOUND', async (_label, membership) => {
    const { guard, context } = setup({ visibility: GroupVisibility.PRIVATE, membership });
    await expectCode(guard.canActivate(context), ErrorCode.NOT_FOUND);
  });

  it('grupo público: no miembro o pending → FORBIDDEN_GROUP; banned → NOT_FOUND', async () => {
    const stranger = setup({ visibility: GroupVisibility.PUBLIC, membership: null });
    await expectCode(stranger.guard.canActivate(stranger.context), ErrorCode.FORBIDDEN_GROUP);

    const pending = setup({
      visibility: GroupVisibility.PUBLIC,
      membership: { role: 'member', status: MembershipStatus.PENDING },
    });
    await expectCode(pending.guard.canActivate(pending.context), ErrorCode.FORBIDDEN_GROUP);

    const banned = setup({
      visibility: GroupVisibility.PUBLIC,
      membership: { role: 'member', status: MembershipStatus.BANNED },
    });
    await expectCode(banned.guard.canActivate(banned.context), ErrorCode.NOT_FOUND);
  });
});

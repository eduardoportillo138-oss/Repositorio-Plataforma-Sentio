import {
  Args,
  Context,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { canViewGroupContent } from '@sentio/core';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { type AuthUser, type GqlContext } from '../../common/graphql/context';
import { ConnectionArgs } from '../../common/pagination/connection.type';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { toUserModel, UserModel } from '../users/dto/user.model';
import {
  type CreateGroupData,
  CreateGroupInput,
  createGroupSchema,
} from './dto/create-group.input';
import {
  GroupMemberConnection,
  GroupMemberModel,
  GroupModel,
  toGroupMemberModel,
  toGroupModel,
} from './dto/group.model';
import { GroupRole } from './decorators/group-role.decorator';
import { GroupsService } from './groups.service';

@Resolver(() => GroupModel)
export class GroupsResolver {
  constructor(private readonly groups: GroupsService) {}

  @Mutation(() => GroupModel)
  async createGroup(
    @CurrentUser() viewer: AuthUser,
    @Args('input', { type: () => CreateGroupInput }, new ZodValidationPipe(createGroupSchema))
    input: CreateGroupData,
  ): Promise<GroupModel> {
    return toGroupModel(await this.groups.create(viewer.userId, input));
  }

  @Query(() => GroupModel, {
    nullable: true,
    description:
      'Devuelve null si el grupo no existe o el usuario no puede verlo (sin distinguir los casos, ' +
      'para no revelar la existencia de grupos privados).',
  })
  async group(
    @CurrentUser() viewer: AuthUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<GroupModel | null> {
    const [group, membership] = await Promise.all([
      this.groups.findById(id),
      this.groups.findMembership(id, viewer.userId),
    ]);
    if (!group || !canViewGroupContent(group.visibility, membership)) return null;
    return toGroupModel(group);
  }

  @GroupRole('member')
  @Query(() => GroupMemberConnection)
  groupMembers(
    @Args('groupId', { type: () => ID }) groupId: string,
    @Args() { first, after }: ConnectionArgs,
  ): Promise<GroupMemberConnection> {
    return this.groups.listActiveMembers(groupId, { first, after });
  }

  @ResolveField(() => GroupMemberModel, {
    nullable: true,
    description: 'Membresía del usuario actual.',
  })
  async viewerMembership(
    @Parent() group: GroupModel,
    @CurrentUser() viewer: AuthUser,
  ): Promise<GroupMemberModel | null> {
    const membership = await this.groups.findMembership(group.id, viewer.userId);
    return membership ? toGroupMemberModel(membership) : null;
  }
}

@Resolver(() => GroupMemberModel)
export class GroupMemberResolver {
  @ResolveField(() => UserModel, { nullable: true })
  async user(
    @Parent() member: GroupMemberModel,
    @Context() ctx: GqlContext,
  ): Promise<UserModel | null> {
    const user = await ctx.loaders.userById.load(member.userId);
    return user ? toUserModel(user) : null;
  }
}

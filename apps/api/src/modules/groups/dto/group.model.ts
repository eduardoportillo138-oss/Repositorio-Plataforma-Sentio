import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { GroupRole, GroupVisibility, MembershipStatus } from '@sentio/core';
import { Paginated } from '../../../common/pagination/connection.type';
import { type GroupMember } from '../schemas/group-member.schema';
import { type Group } from '../schemas/group.schema';

registerEnumType(GroupRole, { name: 'GroupRole' });
registerEnumType(MembershipStatus, { name: 'MembershipStatus' });
registerEnumType(GroupVisibility, { name: 'GroupVisibility' });

@ObjectType('Group')
export class GroupModel {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  slug!: string;

  @Field(() => String, { nullable: true })
  description!: string | null;

  @Field(() => GroupVisibility)
  visibility!: GroupVisibility;

  @Field(() => Int)
  memberCount!: number;

  @Field()
  createdAt!: Date;
}

@ObjectType('GroupMember')
export class GroupMemberModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  groupId!: string;

  @Field(() => ID)
  userId!: string;

  @Field(() => GroupRole)
  role!: GroupRole;

  @Field(() => MembershipStatus)
  status!: MembershipStatus;

  @Field(() => Date, { nullable: true })
  joinedAt!: Date | null;
}

@ObjectType()
export class GroupMemberConnection extends Paginated(GroupMemberModel, 'GroupMember') {}

export function toGroupModel(doc: Group): GroupModel {
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description ?? null,
    visibility: doc.visibility,
    memberCount: doc.memberCount,
    createdAt: doc.createdAt,
  };
}

export function toGroupMemberModel(doc: GroupMember): GroupMemberModel {
  return {
    id: doc._id.toHexString(),
    groupId: doc.groupId.toHexString(),
    userId: doc.userId.toHexString(),
    role: doc.role,
    status: doc.status,
    joinedAt: doc.joinedAt ?? null,
  };
}

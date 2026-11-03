import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { GroupRole, MembershipStatus } from '@sentio/core';
import { type HydratedDocument, Types } from 'mongoose';

@Schema({ collection: 'group_members', timestamps: true })
export class GroupMember {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  groupId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(GroupRole), default: GroupRole.MEMBER })
  role!: GroupRole;

  @Prop({ type: String, enum: Object.values(MembershipStatus), default: MembershipStatus.PENDING })
  status!: MembershipStatus;

  @Prop({ type: Types.ObjectId, default: null })
  invitedBy!: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  joinedAt!: Date | null;

  @Prop({ type: Date, default: null })
  bannedAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export type GroupMemberDocument = HydratedDocument<GroupMember>;

export const GroupMemberSchema = SchemaFactory.createForClass(GroupMember);
GroupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true, name: 'uniq_group_user' });
// "Mis grupos" y listados de miembros paginados por fecha.
GroupMemberSchema.index({ userId: 1, status: 1, createdAt: -1 });
GroupMemberSchema.index({ groupId: 1, status: 1, createdAt: -1, _id: -1 });

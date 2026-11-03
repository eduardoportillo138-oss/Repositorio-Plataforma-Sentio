import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { GroupRole, MembershipStatus } from '@sentio/core';
import { Connection, Model, Types } from 'mongoose';
import { Errors } from '../../common/errors/app-error';
import { type Connection as RelayConnection } from '../../common/pagination/connection.type';
import { paginate } from '../../common/pagination/paginate';
import { type GroupMemberModel, toGroupMemberModel } from './dto/group.model';
import { type CreateGroupData } from './dto/create-group.input';
import { GroupMember } from './schemas/group-member.schema';
import { Group } from './schemas/group.schema';

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(Group.name) private readonly groupModel: Model<Group>,
    @InjectModel(GroupMember.name) private readonly memberModel: Model<GroupMember>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  /** Crea el grupo y la membresía `owner` en una sola transacción (requiere replica set). */
  async create(ownerId: string, data: CreateGroupData): Promise<Group> {
    const owner = new Types.ObjectId(ownerId);
    return this.connection.transaction(async (session) => {
      const [group] = await this.groupModel.create(
        [
          {
            name: data.name,
            slug: slugify(data.name),
            description: data.description ?? null,
            visibility: data.visibility,
            ownerId: owner,
            memberCount: 1,
          },
        ],
        { session },
      );
      if (!group) throw new Error('No se pudo crear el grupo.');
      await this.memberModel.create(
        [
          {
            groupId: group._id,
            userId: owner,
            role: GroupRole.OWNER,
            status: MembershipStatus.ACTIVE,
            joinedAt: new Date(),
          },
        ],
        { session },
      );
      return group.toObject();
    });
  }

  async findById(groupId: string): Promise<Group | null> {
    if (!Types.ObjectId.isValid(groupId)) return null;
    return this.groupModel.findById(groupId).lean<Group>().exec();
  }

  async getById(groupId: string): Promise<Group> {
    const group = await this.findById(groupId);
    if (!group) throw Errors.notFound('Grupo');
    return group;
  }

  async findMembership(groupId: string, userId: string): Promise<GroupMember | null> {
    if (!Types.ObjectId.isValid(groupId) || !Types.ObjectId.isValid(userId)) return null;
    return this.memberModel
      .findOne({ groupId: new Types.ObjectId(groupId), userId: new Types.ObjectId(userId) })
      .lean<GroupMember>()
      .exec();
  }

  listActiveMembers(
    groupId: string,
    args: { first?: number | null; after?: string | null },
  ): Promise<RelayConnection<GroupMemberModel>> {
    return paginate(this.memberModel, toGroupMemberModel, {
      filter: { groupId: new Types.ObjectId(groupId), status: MembershipStatus.ACTIVE },
      sortField: 'createdAt',
      direction: -1,
      first: args.first,
      after: args.after,
    });
  }

  // TODO(Etapa 1): invitaciones, solicitudes de ingreso (pending), aprobar/rechazar,
  // cambio de rol con canAssignRole, baneo con canManageMember y transferencia de owner.
}

function slugify(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  return `${base || 'grupo'}-${randomBytes(3).toString('hex')}`;
}

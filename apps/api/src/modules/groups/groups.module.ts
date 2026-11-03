import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GroupMembershipGuard } from './guards/group-membership.guard';
import { GroupMemberResolver, GroupsResolver } from './groups.resolver';
import { GroupsService } from './groups.service';
import { GroupMember, GroupMemberSchema } from './schemas/group-member.schema';
import { Group, GroupSchema } from './schemas/group.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Group.name, schema: GroupSchema },
      { name: GroupMember.name, schema: GroupMemberSchema },
    ]),
  ],
  providers: [GroupsService, GroupsResolver, GroupMemberResolver, GroupMembershipGuard],
  exports: [GroupsService, GroupMembershipGuard],
})
export class GroupsModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsModule } from '../notifications/notifications.module';
import { PostsModule } from '../posts/posts.module';
import { UsersModule } from '../users/users.module';
import { BlockChecker } from './blocks/block-checker';
import { Share, ShareSchema } from './schemas/share.schema';
import { SharesResolver } from './shares.resolver';
import { SharesService } from './shares.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Share.name, schema: ShareSchema }]),
    PostsModule,
    UsersModule,
    NotificationsModule,
  ],
  providers: [SharesService, SharesResolver, BlockChecker],
  exports: [SharesService, BlockChecker],
})
export class SharesModule {}

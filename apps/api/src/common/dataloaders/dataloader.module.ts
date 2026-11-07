import { Module } from '@nestjs/common';
import { PostsModule } from '../../modules/posts/posts.module';
import { ReactionsModule } from '../../modules/reactions/reactions.module';
import { UsersModule } from '../../modules/users/users.module';
import { DataloaderService } from './dataloader.service';

@Module({
  imports: [UsersModule, PostsModule, ReactionsModule],
  providers: [DataloaderService],
  exports: [DataloaderService],
})
export class DataloaderModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { AuthorSyncService } from './author-sync.service';
import { PostsResolver } from './posts.resolver';
import { PostsService } from './posts.service';
import { Post, PostSchema } from './schemas/post.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]), UsersModule],
  providers: [PostsService, PostsResolver, AuthorSyncService],
  exports: [PostsService, AuthorSyncService],
})
export class PostsModule {}

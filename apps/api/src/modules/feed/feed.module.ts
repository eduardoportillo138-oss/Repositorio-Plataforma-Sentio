import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedResolver } from './feed.resolver';
import { FeedService } from './feed.service';
import { FeedItem, FeedItemSchema } from './schemas/feed-item.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: FeedItem.name, schema: FeedItemSchema }])],
  providers: [FeedService, FeedResolver],
  exports: [FeedService],
})
export class FeedModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchResolver } from './search.resolver';
import { SearchService } from './search.service';
import { SearchHistory, SearchHistorySchema } from './schemas/search-history.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: SearchHistory.name, schema: SearchHistorySchema }])],
  providers: [SearchService, SearchResolver],
  exports: [SearchService],
})
export class SearchModule {}

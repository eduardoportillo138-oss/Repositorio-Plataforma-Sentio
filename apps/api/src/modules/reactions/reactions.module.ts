import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReactionsResolver } from './reactions.resolver';
import { ReactionsService } from './reactions.service';
import { Reaction, ReactionSchema } from './schemas/reaction.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Reaction.name, schema: ReactionSchema }])],
  providers: [ReactionsService, ReactionsResolver],
  exports: [ReactionsService],
})
export class ReactionsModule {}

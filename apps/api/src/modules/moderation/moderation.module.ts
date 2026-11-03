import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModerationResolver } from './moderation.resolver';
import { ModerationService } from './moderation.service';
import { Report, ReportSchema } from './schemas/report.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Report.name, schema: ReportSchema }])],
  providers: [ModerationService, ModerationResolver],
  exports: [ModerationService],
})
export class ModerationModule {}

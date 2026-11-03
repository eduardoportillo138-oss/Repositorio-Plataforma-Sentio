import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MediaResolver } from './media.resolver';
import { MediaService } from './media.service';
import { MediaAsset, MediaAssetSchema } from './schemas/media-asset.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: MediaAsset.name, schema: MediaAssetSchema }])],
  providers: [MediaService, MediaResolver],
  exports: [MediaService],
})
export class MediaModule {}

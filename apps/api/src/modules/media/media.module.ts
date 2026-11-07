import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GatewaysModule } from '../../gateways/gateways.module';
import { UsersModule } from '../users/users.module';
import { AvatarProcessorService } from './avatar-processor.service';
import { MediaJobsService } from './media-jobs.service';
import { MediaResolver } from './media.resolver';
import { MediaService } from './media.service';
import { MediaAsset, MediaAssetSchema } from './schemas/media-asset.schema';
import { MemoryStorageController } from './storage/memory-storage.controller';
import { OBJECT_STORAGE } from './storage/object-storage';
import { objectStorageProvider } from './storage/storage.provider';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MediaAsset.name, schema: MediaAssetSchema }]),
    UsersModule,
    GatewaysModule,
  ],
  controllers: [MemoryStorageController],
  providers: [
    objectStorageProvider,
    MediaJobsService,
    AvatarProcessorService,
    MediaService,
    MediaResolver,
  ],
  exports: [MediaService, AvatarProcessorService, OBJECT_STORAGE],
})
export class MediaModule {}

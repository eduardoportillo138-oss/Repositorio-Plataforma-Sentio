import { type Provider } from '@nestjs/common';
import { AppConfigService } from '../../../config/app-config.service';
import { MemoryStorage } from './memory.storage';
import { OBJECT_STORAGE, type ObjectStorage } from './object-storage';
import { S3Storage } from './s3.storage';

/** Elige la implementación con STORAGE_DRIVER. */
export const objectStorageProvider: Provider = {
  provide: OBJECT_STORAGE,
  inject: [AppConfigService],
  useFactory: (config: AppConfigService): ObjectStorage => {
    if (config.get('STORAGE_DRIVER') === 'memory') {
      return new MemoryStorage(config.get('API_PUBLIC_URL'), config.get('JWT_ACCESS_SECRET'));
    }
    return new S3Storage({
      endpoint: config.get('S3_ENDPOINT'),
      presignEndpoint: config.get('S3_PRESIGN_ENDPOINT'),
      publicUrl: config.get('S3_PUBLIC_URL'),
      region: config.get('S3_REGION'),
      bucket: config.get('S3_BUCKET'),
      accessKeyId: config.get('S3_ACCESS_KEY_ID'),
      secretAccessKey: config.get('S3_SECRET_ACCESS_KEY'),
      forcePathStyle: config.get('S3_FORCE_PATH_STYLE'),
    });
  },
};

import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { encode } from 'blurhash';
import { Model, Types } from 'mongoose';
import sharp from 'sharp';
import { RealtimeGateway } from '../../gateways/realtime.gateway';
import { UsersService } from '../users/users.service';
import { MediaJobsService } from './media-jobs.service';
import { MediaAsset, type MediaVariant } from './schemas/media-asset.schema';
import { OBJECT_STORAGE, type ObjectStorage, StorageKeys } from './storage/object-storage';

export const AVATAR_SIZES = [256, 512] as const;
const BLURHASH_SIZE = 32;
const BLURHASH_COMPONENTS = 4;
/** Evita "bombas" de descompresión: imágenes con dimensiones absurdas. */
const MAX_INPUT_PIXELS = 50_000_000;

export interface ProcessedAvatar {
  variants: { size: number; body: Buffer }[];
  blurhash: string;
  width: number;
  height: number;
}

/**
 * Convierte el original en variantes cuadradas WebP sin metadatos (EXIF, GPS, ICC…).
 * `rotate()` aplica primero la orientación EXIF para que la foto no quede girada.
 */
export async function processAvatarImage(input: Buffer): Promise<ProcessedAvatar> {
  const base = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'error' }).rotate();
  const meta = await base.metadata();

  const variants = await Promise.all(
    AVATAR_SIZES.map(async (size) => ({
      size,
      // sharp no copia metadatos a la salida salvo que se pida con withMetadata().
      body: await base
        .clone()
        .resize(size, size, { fit: 'cover', position: 'attention' })
        .webp({ quality: 82 })
        .toBuffer(),
    })),
  );

  const { data, info } = await base
    .clone()
    .resize(BLURHASH_SIZE, BLURHASH_SIZE, { fit: 'cover' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const blurhash = encode(
    new Uint8ClampedArray(data),
    info.width,
    info.height,
    BLURHASH_COMPONENTS,
    BLURHASH_COMPONENTS,
  );

  // Con orientación 5–8 el ancho y el alto se intercambian al rotar.
  const swapped = (meta.orientation ?? 1) >= 5;
  return {
    variants,
    blurhash,
    width: (swapped ? meta.height : meta.width) ?? 0,
    height: (swapped ? meta.width : meta.height) ?? 0,
  };
}

/** Procesa una foto de perfil confirmada y la asigna al usuario. Lo usan el worker y el modo en línea. */
@Injectable()
export class AvatarProcessorService {
  private readonly logger = new Logger(AvatarProcessorService.name);

  constructor(
    @InjectModel(MediaAsset.name) private readonly assets: Model<MediaAsset>,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    private readonly users: UsersService,
    @Inject(forwardRef(() => MediaJobsService)) private readonly jobs: MediaJobsService,
    private readonly gateway: RealtimeGateway,
  ) {}

  async process(mediaId: string): Promise<MediaAsset | null> {
    const asset = await this.assets.findById(mediaId).lean<MediaAsset>().exec();
    if (!asset || asset.status !== 'processing') return asset;

    const ownerId = asset.ownerId.toHexString();
    try {
      const original = await this.storage.get(asset.storageKey);
      const processed = await processAvatarImage(original);

      const variants: MediaVariant[] = [];
      for (const v of processed.variants) {
        const storageKey = StorageKeys.avatarVariant(ownerId, mediaId, v.size);
        await this.storage.put(storageKey, v.body, 'image/webp');
        variants.push({ size: v.size, storageKey, url: this.storage.publicUrl(storageKey) });
      }

      const ready = await this.assets
        .findByIdAndUpdate(
          mediaId,
          {
            $set: {
              status: 'ready',
              variants,
              blurhash: processed.blurhash,
              width: processed.width,
              height: processed.height,
              error: null,
            },
          },
          { new: true },
        )
        .lean<MediaAsset>()
        .exec();

      const avatar = {
        assetId: new Types.ObjectId(mediaId),
        url256: variants.find((v) => v.size === 256)!.url,
        url512: variants.find((v) => v.size === 512)!.url,
        blurhash: processed.blurhash,
      };
      const previous = await this.users.setAvatar(ownerId, avatar);

      // El original ya no hace falta, ni las variantes de la foto anterior.
      const garbage = [asset.storageKey];
      if (previous && !previous.assetId.equals(avatar.assetId)) {
        garbage.push(...avatarVariantKeys(ownerId, previous.assetId.toHexString()));
      }
      await this.jobs.deleteObjects(garbage);

      this.emit(() =>
        this.gateway.emitToUser(ownerId, 'media:ready', {
          assetId: mediaId,
          purpose: 'avatar',
          avatar: { ...avatar, assetId: mediaId },
        }),
      );
      return ready;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`No se pudo procesar la foto ${mediaId}: ${message}`);
      const failed = await this.assets
        .findByIdAndUpdate(mediaId, { $set: { status: 'failed', error: message } }, { new: true })
        .lean<MediaAsset>()
        .exec();
      await this.jobs.deleteObjects([asset.storageKey]);
      this.emit(() =>
        this.gateway.emitToUser(ownerId, 'media:failed', { assetId: mediaId, purpose: 'avatar' }),
      );
      return failed;
    }
  }

  /** En un proceso solo de workers el gateway no tiene servidor: no se emite. */
  private emit(send: () => void): void {
    try {
      if (this.gateway.server) send();
    } catch (error) {
      this.logger.warn(`No se pudo emitir el evento de medios: ${String(error)}`);
    }
  }
}

export function avatarVariantKeys(userId: string, assetId: string): string[] {
  return AVATAR_SIZES.map((size) => StorageKeys.avatarVariant(userId, assetId, size));
}

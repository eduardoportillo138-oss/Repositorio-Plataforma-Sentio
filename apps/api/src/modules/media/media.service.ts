import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  AVATAR_MAX_BYTES,
  type AvatarUploadInput,
  avatarUploadSchema,
  UPLOAD_URL_TTL_SECONDS,
} from '@sentio/core';
import { Model, Types } from 'mongoose';
import { Errors } from '../../common/errors/app-error';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { type UserDocumentLean } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { avatarVariantKeys } from './avatar-processor.service';
import { MediaJobsService } from './media-jobs.service';
import { MediaAsset } from './schemas/media-asset.schema';
import { OBJECT_STORAGE, type ObjectStorage, StorageKeys } from './storage/object-storage';

export interface AvatarUploadTicket {
  assetId: string;
  uploadUrl: string;
  headers: { name: string; value: string }[];
  expiresAt: Date;
}

const uploadPipe = new ZodValidationPipe(avatarUploadSchema);

@Injectable()
export class MediaService {
  constructor(
    @InjectModel(MediaAsset.name) private readonly model: Model<MediaAsset>,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    private readonly users: UsersService,
    private readonly jobs: MediaJobsService,
  ) {}

  async findById(id: string): Promise<MediaAsset | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.model.findById(id).lean<MediaAsset>().exec();
  }

  /** Paso 1: registra el asset `pending` y devuelve una URL prefirmada para el PUT. */
  async requestAvatarUpload(userId: string, raw: AvatarUploadInput): Promise<AvatarUploadTicket> {
    const input = uploadPipe.transform(raw);
    const _id = new Types.ObjectId();
    const assetId = _id.toHexString();
    const storageKey = StorageKeys.upload(userId, assetId);

    await this.model.create({
      _id,
      ownerId: new Types.ObjectId(userId),
      kind: 'image',
      purpose: 'avatar',
      status: 'pending',
      storageKey,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
    });

    const presigned = await this.storage.presignPut(
      storageKey,
      input.mimeType,
      UPLOAD_URL_TTL_SECONDS,
    );
    return {
      assetId,
      uploadUrl: presigned.url,
      headers: Object.entries(presigned.headers).map(([name, value]) => ({ name, value })),
      expiresAt: new Date(Date.now() + UPLOAD_URL_TTL_SECONDS * 1000),
    };
  }

  /**
   * Paso 2: comprueba que el archivo se subió, que es del usuario y que respeta el límite,
   * y lo manda a procesar. Es idempotente: confirmar dos veces no encola dos jobs.
   */
  async confirmAvatarUpload(userId: string, assetId: string): Promise<MediaAsset> {
    const asset = await this.findById(assetId);
    if (!asset || asset.purpose !== 'avatar') throw Errors.notFound('Archivo');
    if (!asset.ownerId.equals(userId)) throw Errors.forbidden();
    if (asset.status !== 'pending') return asset;

    const head = await this.storage.head(asset.storageKey);
    if (!head) throw Errors.notFound('Archivo');
    if (head.size > AVATAR_MAX_BYTES || head.size === 0) {
      await this.markFailed(assetId, `Tamaño inválido: ${head.size} bytes`);
      await this.jobs.deleteObjects([asset.storageKey]);
      throw Errors.badInput('Archivo inválido.', {
        sizeBytes: [head.size === 0 ? 'validation.avatar.empty' : 'validation.avatar.size'],
      });
    }

    // Transición atómica pending → processing: solo una confirmación concurrente gana.
    const claimed = await this.model
      .findOneAndUpdate(
        { _id: asset._id, status: 'pending' },
        { $set: { status: 'processing', sizeBytes: head.size } },
        { new: true },
      )
      .lean<MediaAsset>()
      .exec();
    if (!claimed) return (await this.findById(assetId)) ?? asset;

    const processed = await this.jobs.processAvatar(assetId);
    return processed ?? claimed;
  }

  /** Quita la foto de perfil de inmediato y borra sus archivos en segundo plano. */
  async removeAvatar(userId: string): Promise<UserDocumentLean> {
    const { user, previous } = await this.users.clearAvatar(userId);
    if (previous) {
      await this.jobs.deleteObjects(avatarVariantKeys(userId, previous.assetId.toHexString()));
    }
    return user;
  }

  private async markFailed(assetId: string, error: string): Promise<void> {
    await this.model.updateOne({ _id: assetId }, { $set: { status: 'failed', error } }).exec();
  }
}

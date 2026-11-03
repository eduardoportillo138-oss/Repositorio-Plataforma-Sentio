import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

export const MEDIA_KINDS = ['image', 'video'] as const;
export const MEDIA_STATUSES = ['pending', 'processing', 'ready', 'failed'] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];
export type MediaStatus = (typeof MEDIA_STATUSES)[number];
@Schema({ collection: 'media_assets', timestamps: true })
export class MediaAsset {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  ownerId!: Types.ObjectId;

  @Prop({ type: String, enum: MEDIA_KINDS, required: true })
  kind!: MediaKind;

  @Prop({ type: String, enum: MEDIA_STATUSES, default: 'pending' })
  status!: MediaStatus;

  @Prop({ required: true })
  storageKey!: string;

  @Prop({ required: true })
  mimeType!: string;

  @Prop({ default: 0 })
  sizeBytes!: number;

  @Prop({ type: Number, default: null })
  width!: number | null;

  @Prop({ type: Number, default: null })
  height!: number | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export type MediaAssetDocument = HydratedDocument<MediaAsset>;

export const MediaAssetSchema = SchemaFactory.createForClass(MediaAsset);
MediaAssetSchema.index({ ownerId: 1, createdAt: -1 });
MediaAssetSchema.index({ storageKey: 1 }, { unique: true });

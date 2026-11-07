import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

export const MEDIA_KINDS = ['image', 'video'] as const;
export const MEDIA_STATUSES = ['pending', 'processing', 'ready', 'failed'] as const;
export const MEDIA_PURPOSES = ['avatar'] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];
export type MediaStatus = (typeof MEDIA_STATUSES)[number];
export type MediaPurpose = (typeof MEDIA_PURPOSES)[number];

/** Variante procesada (p. ej. WebP de 256 px). */
@Schema({ _id: false })
export class MediaVariant {
  @Prop({ required: true })
  size!: number;

  @Prop({ required: true })
  storageKey!: string;

  @Prop({ required: true })
  url!: string;
}
const MediaVariantSchema = SchemaFactory.createForClass(MediaVariant);

@Schema({ collection: 'media_assets', timestamps: true })
export class MediaAsset {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  ownerId!: Types.ObjectId;

  @Prop({ type: String, enum: MEDIA_KINDS, required: true })
  kind!: MediaKind;

  @Prop({ type: String, enum: MEDIA_PURPOSES, required: true })
  purpose!: MediaPurpose;

  @Prop({ type: String, enum: MEDIA_STATUSES, default: 'pending' })
  status!: MediaStatus;

  /** Clave del archivo original (privado). Se borra al terminar de procesarlo. */
  @Prop({ required: true })
  storageKey!: string;

  @Prop({ required: true })
  mimeType!: string;

  /** Tamaño declarado al pedir la URL; al confirmar se reemplaza por el real. */
  @Prop({ default: 0 })
  sizeBytes!: number;

  @Prop({ type: Number, default: null })
  width!: number | null;

  @Prop({ type: Number, default: null })
  height!: number | null;

  @Prop({ type: [MediaVariantSchema], default: [] })
  variants!: MediaVariant[];

  @Prop({ type: String, default: null })
  blurhash!: string | null;

  /** Motivo del fallo de procesamiento (para diagnóstico; no se expone tal cual). */
  @Prop({ type: String, default: null })
  error!: string | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export type MediaAssetDocument = HydratedDocument<MediaAsset>;

export const MediaAssetSchema = SchemaFactory.createForClass(MediaAsset);
MediaAssetSchema.index({ ownerId: 1, createdAt: -1 });
MediaAssetSchema.index({ storageKey: 1 }, { unique: true });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  BIO_MAX_LENGTH,
  type Locale,
  MAX_PROFILE_TAGS,
  PROFILE_QUALITIES,
  type ProfileQuality,
  supportedLocales,
} from '@sentio/core';
import { type HydratedDocument, Types } from 'mongoose';

export const USER_STATUSES = ['active', 'suspended', 'deleted'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

/**
 * Evidencia del consentimiento (LFPDPPP): qué versión del Aviso de Privacidad aceptó el titular,
 * cuándo y desde dónde, y su elección sobre finalidades secundarias (marketing).
 */
@Schema({ _id: false })
export class Consents {
  @Prop({ required: true })
  privacyNoticeVersion!: string;

  @Prop({ required: true })
  privacyNoticeAcceptedAt!: Date;

  @Prop({ required: true, default: false })
  marketingOptIn!: boolean;

  @Prop({ required: true })
  marketingOptInUpdatedAt!: Date;

  @Prop({ type: String, default: null })
  ip!: string | null;

  @Prop({ type: String, default: null })
  userAgent!: string | null;
}
const ConsentsSchema = SchemaFactory.createForClass(Consents);

/** Foto de perfil procesada (variantes WebP públicas + blurhash para el marcador). */
@Schema({ _id: false })
export class Avatar {
  @Prop({ type: Types.ObjectId, required: true })
  assetId!: Types.ObjectId;

  @Prop({ required: true })
  url256!: string;

  @Prop({ required: true })
  url512!: string;

  @Prop({ required: true })
  blurhash!: string;
}
const AvatarSchema = SchemaFactory.createForClass(Avatar);

/**
 * Datos de contacto privados: solo los ve el propio usuario. Nunca se exponen en búsquedas,
 * en el feed ni como datos del autor de un post.
 */
@Schema({ _id: false })
export class PrivateContact {
  @Prop({ type: String })
  phone?: string;

  @Prop({ type: String })
  altEmail?: string;

  @Prop({ type: String })
  institution?: string;

  @Prop({ type: String })
  studentId?: string;

  @Prop({ type: String })
  emergencyContactName?: string;

  @Prop({ type: String })
  emergencyContactPhone?: string;
}
const PrivateContactSchema = SchemaFactory.createForClass(PrivateContact);

@Schema({ collection: 'users', timestamps: true })
export class User {
  _id!: Types.ObjectId;

  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  handle!: string;

  @Prop({ required: true, trim: true })
  displayName!: string;

  @Prop({ type: AvatarSchema, default: null })
  avatar!: Avatar | null;

  @Prop({ type: String, default: null, maxlength: BIO_MAX_LENGTH })
  bio!: string | null;

  @Prop({
    type: [{ type: String, enum: PROFILE_QUALITIES }],
    default: [],
    validate: {
      validator: (v: string[]) => v.length <= MAX_PROFILE_TAGS && new Set(v).size === v.length,
      message: `Máximo ${MAX_PROFILE_TAGS} cualidades distintas.`,
    },
  })
  tags!: ProfileQuality[];

  @Prop({ type: PrivateContactSchema, default: () => ({}) })
  privateContact!: PrivateContact;

  /** Nombre + handle normalizados para la búsqueda local. No se selecciona por defecto. */
  @Prop({ type: String, default: '', select: false })
  searchName?: string;

  /** Hash Argon2id. Nunca se selecciona por defecto. */
  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ type: String, enum: supportedLocales, default: 'es' })
  locale!: Locale;

  @Prop({ type: String, enum: USER_STATUSES, default: 'active' })
  status!: UserStatus;

  @Prop({ type: ConsentsSchema, required: true })
  consents!: Consents;

  createdAt!: Date;
  updatedAt!: Date;
}

export type UserDocument = HydratedDocument<User>;
/** Resultado de consultas `.lean()` (sin el hash, que no se selecciona por defecto). */
export type UserDocumentLean = Omit<User, 'passwordHash'>;

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 }, { unique: true, name: 'uniq_email' });
UserSchema.index({ handle: 1 }, { unique: true, name: 'uniq_handle' });
UserSchema.index({ status: 1, searchName: 1 }, { name: 'search_name' });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type Locale, supportedLocales } from '@sentio/core';
import { type HydratedDocument, type Types } from 'mongoose';

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

@Schema({ collection: 'users', timestamps: true })
export class User {
  _id!: Types.ObjectId;

  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  handle!: string;

  @Prop({ required: true, trim: true })
  displayName!: string;

  @Prop({ type: String, default: null })
  avatarUrl!: string | null;

  @Prop({ type: String, default: null })
  bio!: string | null;

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

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

export const SESSION_REVOKE_REASONS = ['logout', 'logout_all', 'reuse_detected', 'admin'] as const;
export type SessionRevokeReason = (typeof SESSION_REVOKE_REASONS)[number];

/** Cuántos hashes de tokens ya rotados se conservan para detectar reutilización. */
export const MAX_PREVIOUS_TOKEN_HASHES = 50;

/**
 * Una sesión por dispositivo/inicio de sesión. Guarda solo el HMAC-SHA256 del refresh token vigente
 * (nunca el token en claro) y los hashes de los tokens ya rotados de la misma familia.
 * Si llega un token rotado, alguien lo reutilizó: se revoca la sesión completa.
 */
@Schema({ collection: 'sessions', timestamps: true })
export class Session {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  tokenHash!: string;

  @Prop({ type: [String], default: [] })
  previousTokenHashes!: string[];

  /** Expiración deslizante: se renueva en cada rotación. Índice TTL: Mongo borra la sesión al vencer. */
  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ type: Date, default: null })
  revokedAt!: Date | null;

  @Prop({ type: String, enum: SESSION_REVOKE_REASONS, default: null })
  revokedReason!: SessionRevokeReason | null;

  @Prop({ type: Date, default: null })
  lastRotatedAt!: Date | null;

  @Prop({ type: String, default: null })
  userAgent!: string | null;

  @Prop({ type: String, default: null })
  ip!: string | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export type SessionDocument = HydratedDocument<Session>;

export const SessionSchema = SchemaFactory.createForClass(Session);
SessionSchema.index({ tokenHash: 1 }, { unique: true, name: 'uniq_token_hash' });
SessionSchema.index({ previousTokenHashes: 1 }, { name: 'previous_token_hashes' });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'ttl_expires_at' });

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Errors } from '../../common/errors/app-error';
import {
  MAX_PREVIOUS_TOKEN_HASHES,
  Session,
  type SessionRevokeReason,
} from './schemas/session.schema';
import { TokensService } from './tokens.service';

export interface ClientMeta {
  ip: string | null;
  userAgent: string | null;
}

export interface IssuedSession {
  sessionId: string;
  userId: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    @InjectModel(Session.name) private readonly sessionModel: Model<Session>,
    private readonly tokens: TokensService,
  ) {}

  async create(userId: string, meta: ClientMeta): Promise<IssuedSession> {
    const refreshToken = this.tokens.generateRefreshToken();
    const expiresAt = this.tokens.refreshTokenExpiry();
    const session = await this.sessionModel.create({
      userId: new Types.ObjectId(userId),
      tokenHash: this.tokens.hashRefreshToken(refreshToken),
      expiresAt,
      userAgent: meta.userAgent,
      ip: meta.ip,
    });
    return {
      sessionId: session._id.toHexString(),
      userId,
      refreshToken,
      refreshTokenExpiresAt: expiresAt,
    };
  }

  /**
   * Rota el refresh token de forma atómica: solo una petición puede canjear un token dado.
   * - Token vigente → se reemplaza por uno nuevo y se guarda el hash viejo en el historial.
   * - Token ya rotado → reutilización: se revoca la sesión entera (el atacante y la víctima la pierden).
   * - Token desconocido, revocado o vencido → inválido.
   */
  async rotate(refreshToken: string, meta: ClientMeta): Promise<IssuedSession> {
    const now = new Date();
    const presentedHash = this.tokens.hashRefreshToken(refreshToken);
    const nextToken = this.tokens.generateRefreshToken();
    const nextHash = this.tokens.hashRefreshToken(nextToken);
    const expiresAt = this.tokens.refreshTokenExpiry(now);

    const rotated = await this.sessionModel
      .findOneAndUpdate(
        { tokenHash: presentedHash, revokedAt: null, expiresAt: { $gt: now } },
        {
          $set: {
            tokenHash: nextHash,
            expiresAt,
            lastRotatedAt: now,
            ip: meta.ip,
            userAgent: meta.userAgent,
          },
          $push: {
            previousTokenHashes: { $each: [presentedHash], $slice: -MAX_PREVIOUS_TOKEN_HASHES },
          },
        },
        { new: true },
      )
      .lean<Session>()
      .exec();

    if (rotated) {
      return {
        sessionId: rotated._id.toHexString(),
        userId: rotated.userId.toHexString(),
        refreshToken: nextToken,
        refreshTokenExpiresAt: expiresAt,
      };
    }

    const reused = await this.sessionModel
      .findOneAndUpdate(
        { previousTokenHashes: presentedHash, revokedAt: null },
        { $set: { revokedAt: now, revokedReason: 'reuse_detected' satisfies SessionRevokeReason } },
        { new: true },
      )
      .lean<Session>()
      .exec();

    if (reused) {
      this.logger.warn(
        `Reutilización de refresh token detectada: sesión ${reused._id.toHexString()} del usuario ${reused.userId.toHexString()} revocada.`,
      );
      throw Errors.refreshTokenReused();
    }

    // Token rotado de una sesión ya revocada: sigue siendo un intento de reutilización.
    const revokedFamily = await this.sessionModel.exists({ previousTokenHashes: presentedHash });
    if (revokedFamily) throw Errors.refreshTokenReused();

    throw Errors.refreshTokenInvalid();
  }

  async isActive(sessionId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(sessionId)) return false;
    const found = await this.sessionModel.exists({
      _id: sessionId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });
    return Boolean(found);
  }

  async revoke(sessionId: string, reason: SessionRevokeReason = 'logout'): Promise<void> {
    await this.sessionModel
      .updateOne(
        { _id: sessionId, revokedAt: null },
        { $set: { revokedAt: new Date(), revokedReason: reason } },
      )
      .exec();
  }

  async revokeAllForUser(
    userId: string,
    reason: SessionRevokeReason = 'logout_all',
  ): Promise<number> {
    const result = await this.sessionModel
      .updateMany(
        { userId: new Types.ObjectId(userId), revokedAt: null },
        { $set: { revokedAt: new Date(), revokedReason: reason } },
      )
      .exec();
    return result.modifiedCount;
  }
}

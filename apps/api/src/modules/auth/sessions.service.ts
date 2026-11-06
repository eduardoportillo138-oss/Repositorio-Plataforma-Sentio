import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Errors } from '../../common/errors/app-error';
import {
  MAX_PREVIOUS_TOKEN_HASHES,
  Session,
  type SessionRevokeReason,
} from './schemas/session.schema';
import { SESSION_ACTIVITY_CACHE, type SessionActivityCache } from './session-activity.cache';
import { SessionEvents } from './session-events';
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
    @Inject(SESSION_ACTIVITY_CACHE) private readonly cache: SessionActivityCache,
    private readonly events: SessionEvents,
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
      const sessionId = reused._id.toHexString();
      const userId = reused.userId.toHexString();
      this.logger.warn(
        `Reutilización de refresh token detectada: sesión ${sessionId} del usuario ${userId} revocada.`,
      );
      await this.afterRevoke(userId, [sessionId], 'reuse_detected');
      throw Errors.refreshTokenReused();
    }

    // Token rotado de una sesión ya revocada: sigue siendo un intento de reutilización.
    const revokedFamily = await this.sessionModel.exists({ previousTokenHashes: presentedHash });
    if (revokedFamily) throw Errors.refreshTokenReused();

    throw Errors.refreshTokenInvalid();
  }

  /**
   * `true` si la sesión existe, no está revocada y no venció. El resultado se cachea
   * SESSION_ACTIVITY_TTL_SECONDS; las revocaciones lo sobrescriben al momento.
   */
  async isActive(sessionId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(sessionId)) return false;

    const cached = await this.cache.get(sessionId);
    if (cached !== null) return cached;

    const found = await this.sessionModel.exists({
      _id: sessionId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });
    if (found) {
      await this.cache.markActive(sessionId);
      return true;
    }
    // Una sesión inactiva nunca vuelve a activarse: cachear el "no" también es seguro.
    await this.cache.markRevoked([sessionId]);
    return false;
  }

  async revoke(sessionId: string, reason: SessionRevokeReason = 'logout'): Promise<void> {
    if (!Types.ObjectId.isValid(sessionId)) return;
    const revoked = await this.sessionModel
      .findOneAndUpdate(
        { _id: sessionId, revokedAt: null },
        { $set: { revokedAt: new Date(), revokedReason: reason } },
        { new: true, projection: { _id: 1, userId: 1 } },
      )
      .lean<Pick<Session, '_id' | 'userId'>>()
      .exec();
    if (revoked) await this.afterRevoke(revoked.userId.toHexString(), [sessionId], reason);
  }

  async revokeAllForUser(
    userId: string,
    reason: SessionRevokeReason = 'logout_all',
  ): Promise<number> {
    const owner = new Types.ObjectId(userId);
    // Misma marca de tiempo para todo el lote: permite leer después exactamente qué sesiones
    // revocó esta llamada (updateMany no devuelve los ids modificados).
    const revokedAt = new Date();
    const result = await this.sessionModel
      .updateMany(
        { userId: owner, revokedAt: null },
        { $set: { revokedAt, revokedReason: reason } },
      )
      .exec();
    if (result.modifiedCount === 0) return 0;

    const revoked = await this.sessionModel
      .find({ userId: owner, revokedAt, revokedReason: reason }, { _id: 1 })
      .lean<Pick<Session, '_id'>[]>()
      .exec();
    await this.afterRevoke(
      userId,
      revoked.map((s) => s._id.toHexString()),
      reason,
    );
    return result.modifiedCount;
  }

  /** Invalida la cache y avisa a los sockets abiertos. Todo camino de revocación pasa por aquí. */
  private async afterRevoke(
    userId: string,
    sessionIds: string[],
    reason: SessionRevokeReason,
  ): Promise<void> {
    await this.cache.markRevoked(sessionIds);
    this.events.emitRevoked({ userId, sessionIds, reason });
  }
}

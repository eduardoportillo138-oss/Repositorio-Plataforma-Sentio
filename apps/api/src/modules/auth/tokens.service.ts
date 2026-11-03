import { createHmac, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '../../config/app-config.service';
import { type AuthUser } from '../../common/graphql/context';

interface AccessTokenPayload {
  sub: string;
  sid: string;
  typ: 'access';
}

export interface IssuedAccessToken {
  token: string;
  expiresAt: Date;
}

@Injectable()
export class TokensService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
  ) {}

  async signAccessToken(user: AuthUser): Promise<IssuedAccessToken> {
    const ttl = this.config.get('JWT_ACCESS_TTL_SECONDS');
    const payload: AccessTokenPayload = { sub: user.userId, sid: user.sessionId, typ: 'access' };
    const token = await this.jwt.signAsync(payload);
    return { token, expiresAt: new Date(Date.now() + ttl * 1000) };
  }

  /** Devuelve el usuario si el token es válido (firma, exp, iss, aud y tipo); si no, `null`. */
  async verifyAccessToken(token: string): Promise<AuthUser | null> {
    try {
      const payload = await this.jwt.verifyAsync<Partial<AccessTokenPayload>>(token);
      if (payload.typ !== 'access' || !payload.sub || !payload.sid) return null;
      return { userId: payload.sub, sessionId: payload.sid };
    } catch {
      return null;
    }
  }

  /** Refresh token opaco: 256 bits aleatorios, sin información decodificable. */
  generateRefreshToken(): string {
    return randomBytes(32).toString('base64url');
  }

  /** HMAC-SHA256 con pepper: una fuga de la colección sessions no permite usar los tokens. */
  hashRefreshToken(token: string): string {
    return createHmac('sha256', this.config.get('JWT_REFRESH_SECRET'))
      .update(token)
      .digest('base64url');
  }

  refreshTokenExpiry(from = new Date()): Date {
    return new Date(
      from.getTime() + this.config.get('REFRESH_TOKEN_TTL_DAYS') * 24 * 60 * 60 * 1000,
    );
  }
}

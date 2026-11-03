import { Injectable } from '@nestjs/common';
import { type LoginInput, type RegisterData } from '@sentio/core';
import { Errors } from '../../common/errors/app-error';
import { AppConfigService } from '../../config/app-config.service';
import { type UserDocumentLean } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { PasswordService } from './password.service';
import { type ClientMeta, type IssuedSession, SessionsService } from './sessions.service';
import { TokensService } from './tokens.service';

export interface AuthResult {
  sessionId: string;
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  user: UserDocumentLean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionsService,
    private readonly tokens: TokensService,
    private readonly config: AppConfigService,
  ) {}

  async register(input: RegisterData, meta: ClientMeta): Promise<AuthResult> {
    const taken = await this.users.findTakenIdentifiers(input.email, input.handle);
    if (taken.email) throw Errors.conflict('Ya existe una cuenta con este correo.', 'email');
    if (taken.handle) throw Errors.conflict('Este nombre de usuario no está disponible.', 'handle');

    const user = await this.users.create({
      email: input.email,
      handle: input.handle,
      displayName: input.displayName,
      passwordHash: await this.passwords.hash(input.password),
      locale: input.locale,
      privacyNoticeVersion: this.config.get('PRIVACY_NOTICE_VERSION'),
      marketingOptIn: input.marketingOptIn,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    return this.issue(user, await this.sessions.create(user._id.toHexString(), meta));
  }

  async login(input: LoginInput, meta: ClientMeta): Promise<AuthResult> {
    const found = await this.users.findByEmailWithPassword(input.email);
    if (!found) {
      await this.passwords.verifyDummy(input.password);
      throw Errors.invalidCredentials();
    }

    const { passwordHash, ...user } = found;
    if (!(await this.passwords.verify(passwordHash, input.password))) {
      throw Errors.invalidCredentials();
    }
    if (user.status !== 'active') throw Errors.forbidden('Esta cuenta no está disponible.');

    const userId = user._id.toHexString();
    if (this.passwords.needsRehash(passwordHash)) {
      await this.users.updatePasswordHash(userId, await this.passwords.hash(input.password));
    }

    return this.issue(user, await this.sessions.create(userId, meta));
  }

  async refresh(refreshToken: string, meta: ClientMeta): Promise<AuthResult> {
    const session = await this.sessions.rotate(refreshToken, meta);
    const user = await this.users.findById(session.userId);
    if (!user || user.status !== 'active') {
      await this.sessions.revoke(session.sessionId, 'admin');
      throw Errors.refreshTokenInvalid();
    }
    return this.issue(user, session);
  }

  async logout(userId: string, sessionId: string, allDevices: boolean): Promise<void> {
    if (allDevices) {
      await this.sessions.revokeAllForUser(userId);
    } else {
      await this.sessions.revoke(sessionId, 'logout');
    }
  }

  private async issue(user: UserDocumentLean, session: IssuedSession): Promise<AuthResult> {
    const access = await this.tokens.signAccessToken({
      userId: session.userId,
      sessionId: session.sessionId,
    });
    return {
      sessionId: session.sessionId,
      accessToken: access.token,
      accessTokenExpiresAt: access.expiresAt,
      refreshToken: session.refreshToken,
      refreshTokenExpiresAt: session.refreshTokenExpiresAt,
      user,
    };
  }
}

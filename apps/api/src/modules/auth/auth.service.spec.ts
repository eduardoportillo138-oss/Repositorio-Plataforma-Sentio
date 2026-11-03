import { ErrorCode, registerSchema } from '@sentio/core';
import { Types } from 'mongoose';
import { type UserDocumentLean } from '../users/schemas/user.schema';
import { type CreateUserData, type UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { type SessionsService } from './sessions.service';
import { fakeConfig, makeTokensService } from './test-helpers';

const meta = { ip: '127.0.0.1', userAgent: 'jest' };

function makeUser(overrides: Partial<UserDocumentLean> = {}): UserDocumentLean {
  return {
    _id: new Types.ObjectId(),
    email: 'ana@example.com',
    handle: 'ana',
    displayName: 'Ana',
    avatarUrl: null,
    bio: null,
    locale: 'es',
    status: 'active',
    consents: {
      privacyNoticeVersion: 'test-1',
      privacyNoticeAcceptedAt: new Date(),
      marketingOptIn: false,
      marketingOptInUpdatedAt: new Date(),
      ip: null,
      userAgent: null,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function setup() {
  const users = {
    findTakenIdentifiers: jest.fn().mockResolvedValue({ email: false, handle: false }),
    create: jest.fn<Promise<UserDocumentLean>, [CreateUserData]>(),
    findByEmailWithPassword: jest.fn(),
    findById: jest.fn(),
    updatePasswordHash: jest.fn(),
  };
  const sessions = {
    create: jest.fn((userId: string) =>
      Promise.resolve({
        sessionId: new Types.ObjectId().toHexString(),
        userId,
        refreshToken: 'rt',
        refreshTokenExpiresAt: new Date(),
      }),
    ),
    rotate: jest.fn(),
    revoke: jest.fn(),
    revokeAllForUser: jest.fn(),
  };
  const passwords = new PasswordService();
  const tokens = makeTokensService();
  const service = new AuthService(
    users as unknown as UsersService,
    passwords,
    sessions as unknown as SessionsService,
    tokens,
    fakeConfig(),
  );
  return { service, users, sessions, passwords, tokens };
}

const validRegistration = registerSchema.parse({
  email: ' Ana@Example.com ',
  password: 'contrasena123',
  handle: 'Ana',
  displayName: 'Ana',
  acceptPrivacyNotice: true,
});

describe('AuthService', () => {
  describe('register', () => {
    it('crea el usuario con Argon2id y la versión vigente del Aviso de Privacidad', async () => {
      const { service, users, tokens } = setup();
      const user = makeUser();
      users.create.mockResolvedValue(user);

      const result = await service.register(validRegistration, meta);

      const data = users.create.mock.calls[0]?.[0];
      expect(data).toMatchObject({
        email: 'ana@example.com',
        handle: 'ana',
        privacyNoticeVersion: 'test-1',
        marketingOptIn: false,
      });
      expect(data?.passwordHash).toMatch(/^\$argon2id\$/);
      const viewer = await tokens.verifyAccessToken(result.accessToken);
      expect(viewer?.userId).toBe(user._id.toHexString());
    });

    it.each([
      ['email', { email: true, handle: false }],
      ['handle', { email: false, handle: true }],
    ])('rechaza %s duplicado con CONFLICT', async (field, taken) => {
      const { service, users } = setup();
      users.findTakenIdentifiers.mockResolvedValue(taken);
      await expect(service.register(validRegistration, meta)).rejects.toMatchObject({
        extensions: { code: ErrorCode.CONFLICT, field },
      });
      expect(users.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('emite tokens con credenciales válidas', async () => {
      const { service, users, passwords, sessions } = setup();
      const user = makeUser();
      users.findByEmailWithPassword.mockResolvedValue({
        ...user,
        passwordHash: await passwords.hash('contrasena123'),
      });

      const result = await service.login({ email: user.email, password: 'contrasena123' }, meta);
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(sessions.create).toHaveBeenCalledWith(user._id.toHexString(), meta);
    });

    it('usa el mismo error para usuario inexistente y contraseña incorrecta', async () => {
      const { service, users, passwords } = setup();
      const dummy = jest.spyOn(passwords, 'verifyDummy');

      users.findByEmailWithPassword.mockResolvedValue(null);
      await expect(
        service.login({ email: 'x@example.com', password: 'p' }, meta),
      ).rejects.toMatchObject({
        extensions: { code: ErrorCode.INVALID_CREDENTIALS },
      });
      expect(dummy).toHaveBeenCalled();

      users.findByEmailWithPassword.mockResolvedValue({
        ...makeUser(),
        passwordHash: await passwords.hash('correcta1'),
      });
      await expect(
        service.login({ email: 'ana@example.com', password: 'mala' }, meta),
      ).rejects.toMatchObject({
        extensions: { code: ErrorCode.INVALID_CREDENTIALS },
      });
    });

    it('bloquea cuentas suspendidas', async () => {
      const { service, users, passwords } = setup();
      users.findByEmailWithPassword.mockResolvedValue({
        ...makeUser({ status: 'suspended' }),
        passwordHash: await passwords.hash('contrasena123'),
      });
      await expect(
        service.login({ email: 'ana@example.com', password: 'contrasena123' }, meta),
      ).rejects.toMatchObject({ extensions: { code: ErrorCode.FORBIDDEN } });
    });

    it('rehashea contraseñas guardadas con parámetros viejos', async () => {
      const { service, users, passwords } = setup();
      jest.spyOn(passwords, 'needsRehash').mockReturnValue(true);
      users.findByEmailWithPassword.mockResolvedValue({
        ...makeUser(),
        passwordHash: await passwords.hash('contrasena123'),
      });
      await service.login({ email: 'ana@example.com', password: 'contrasena123' }, meta);
      expect(users.updatePasswordHash).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringMatching(/^\$argon2id\$/),
      );
    });
  });

  describe('refresh', () => {
    it('revoca la sesión si el usuario ya no está activo', async () => {
      const { service, users, sessions } = setup();
      sessions.rotate.mockResolvedValue({
        sessionId: 's1',
        userId: new Types.ObjectId().toHexString(),
        refreshToken: 'rt2',
        refreshTokenExpiresAt: new Date(),
      });
      users.findById.mockResolvedValue(makeUser({ status: 'deleted' }));

      await expect(service.refresh('rt1', meta)).rejects.toMatchObject({
        extensions: { code: ErrorCode.REFRESH_TOKEN_INVALID },
      });
      expect(sessions.revoke).toHaveBeenCalledWith('s1', 'admin');
    });
  });

  describe('logout', () => {
    it('revoca la sesión actual o todas', async () => {
      const { service, sessions } = setup();
      await service.logout('u1', 's1', false);
      expect(sessions.revoke).toHaveBeenCalledWith('s1', 'logout');
      await service.logout('u1', 's1', true);
      expect(sessions.revokeAllForUser).toHaveBeenCalledWith('u1');
    });
  });
});

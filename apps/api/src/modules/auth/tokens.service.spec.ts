import { JwtService } from '@nestjs/jwt';
import { makeTokensService, TEST_ENV } from './test-helpers';

describe('TokensService', () => {
  const tokens = makeTokensService();
  const user = { userId: '65f000000000000000000001', sessionId: '65f000000000000000000002' };

  it('firma un access token de 15 minutos y lo verifica', async () => {
    // Se acota entre el antes y el después de firmar: con las suites en paralelo la firma
    // puede tardar más de unos milisegundos y un margen fijo hacía la prueba intermitente.
    const before = Date.now();
    const { token, expiresAt } = await tokens.signAccessToken(user);
    const after = Date.now();
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + 900_000);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(after + 900_000);
    await expect(tokens.verifyAccessToken(token)).resolves.toEqual(user);
  });

  it('rechaza tokens alterados, de otro emisor o de otro tipo', async () => {
    const { token } = await tokens.signAccessToken(user);
    await expect(tokens.verifyAccessToken(`${token}x`)).resolves.toBeNull();

    const otherSecret = makeTokensService({ JWT_ACCESS_SECRET: 'z'.repeat(48) });
    await expect(otherSecret.verifyAccessToken(token)).resolves.toBeNull();

    const otherIssuer = makeTokensService({ JWT_ISSUER: 'otro' });
    await expect(otherIssuer.verifyAccessToken(token)).resolves.toBeNull();

    const refreshLike = await new JwtService({ secret: TEST_ENV.JWT_ACCESS_SECRET }).signAsync(
      { sub: user.userId, sid: user.sessionId, typ: 'refresh' },
      { issuer: TEST_ENV.JWT_ISSUER, audience: TEST_ENV.JWT_AUDIENCE },
    );
    await expect(tokens.verifyAccessToken(refreshLike)).resolves.toBeNull();
  });

  it('rechaza tokens expirados', async () => {
    const expired = makeTokensService({ JWT_ACCESS_TTL_SECONDS: 1 });
    const { token } = await expired.signAccessToken(user);
    jest.useFakeTimers({ now: Date.now() + 5_000 });
    try {
      await expect(expired.verifyAccessToken(token)).resolves.toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('genera refresh tokens opacos de 256 bits, únicos', () => {
    const a = tokens.generateRefreshToken();
    const b = tokens.generateRefreshToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a).not.toBe(b);
  });

  it('el hash del refresh token es determinista y depende del pepper', () => {
    const token = tokens.generateRefreshToken();
    expect(tokens.hashRefreshToken(token)).toBe(tokens.hashRefreshToken(token));
    expect(tokens.hashRefreshToken(token)).not.toContain(token);
    const otherPepper = makeTokensService({ JWT_REFRESH_SECRET: 'p'.repeat(48) });
    expect(otherPepper.hashRefreshToken(token)).not.toBe(tokens.hashRefreshToken(token));
  });

  it('el refresh token vence a los 30 días', () => {
    const from = new Date('2026-01-01T00:00:00Z');
    expect(tokens.refreshTokenExpiry(from).toISOString()).toBe('2026-01-31T00:00:00.000Z');
  });
});

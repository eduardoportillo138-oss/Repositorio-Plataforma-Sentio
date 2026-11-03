import { JwtService } from '@nestjs/jwt';
import { type AppConfigService } from '../../config/app-config.service';
import { type Env } from '../../config/env.schema';
import { TokensService } from './tokens.service';

/** Configuración mínima para pruebas unitarias de auth (sin leer .env). */
export const TEST_ENV: Partial<Env> = {
  NODE_ENV: 'test',
  JWT_ACCESS_SECRET: 'a'.repeat(48),
  JWT_REFRESH_SECRET: 'r'.repeat(48),
  JWT_ACCESS_TTL_SECONDS: 900,
  REFRESH_TOKEN_TTL_DAYS: 30,
  JWT_ISSUER: 'sentio-api',
  JWT_AUDIENCE: 'sentio-clients',
  PRIVACY_NOTICE_VERSION: 'test-1',
};

export function fakeConfig(overrides: Partial<Env> = {}): AppConfigService {
  const env = { ...TEST_ENV, ...overrides };
  return { get: (key: keyof Env) => env[key] } as unknown as AppConfigService;
}

export function makeTokensService(overrides: Partial<Env> = {}): TokensService {
  const config = fakeConfig(overrides);
  const jwt = new JwtService({
    secret: config.get('JWT_ACCESS_SECRET'),
    signOptions: {
      algorithm: 'HS256',
      expiresIn: config.get('JWT_ACCESS_TTL_SECONDS'),
      issuer: config.get('JWT_ISSUER'),
      audience: config.get('JWT_AUDIENCE'),
    },
    verifyOptions: {
      algorithms: ['HS256'],
      issuer: config.get('JWT_ISSUER'),
      audience: config.get('JWT_AUDIENCE'),
    },
  });
  return new TokensService(jwt, config);
}

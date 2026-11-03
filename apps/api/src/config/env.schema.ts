import { z } from 'zod';

const bool = z.enum(['true', 'false', '1', '0']).transform((v) => v === 'true' || v === '1');

const csv = z.string().transform((v) =>
  v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

/** Variables de entorno de la API. Se validan al arrancar: si falta algo, la app no inicia. */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: csv.default(['http://localhost:3000', 'http://localhost:8081']),
  GRAPHQL_PLAYGROUND: bool.default(false),
  GRAPHQL_DEPTH_LIMIT: z.coerce.number().int().positive().default(7),

  MONGODB_URI: z
    .string()
    .regex(/^mongodb(\+srv)?:\/\//, 'Debe ser una cadena de conexión de MongoDB'),
  REDIS_URL: z.string().regex(/^rediss?:\/\//, 'Debe ser una URL redis:// o rediss://'),
  QUEUES_ENABLED: bool.default(true),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET debe tener al menos 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET debe tener al menos 32 caracteres'),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  JWT_ISSUER: z.string().default('sentio-api'),
  JWT_AUDIENCE: z.string().default('sentio-clients'),
  REFRESH_COOKIE_NAME: z.string().default('sentio_rt'),
  COOKIE_SECURE: bool.default(false),

  RATE_LIMIT_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_DEFAULT_MAX: z.coerce.number().int().positive().default(300),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(10),

  PRIVACY_NOTICE_VERSION: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Configuración de entorno inválida:\n${details}`);
  }
  return result.data;
}

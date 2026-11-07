import { z } from 'zod';

const bool = z.enum(['true', 'false', '1', '0']).transform((v) => v === 'true' || v === '1');

const csv = z.string().transform((v) =>
  v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

/** Variables de entorno de la API. Se validan al arrancar: si falta algo, la app no inicia. */
export const envSchema = z
  .object({
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
    /** Publicaciones por usuario y hora. */
    RATE_LIMIT_POSTS_PER_HOUR: z.coerce.number().int().positive().default(10),
    /** Envíos de "compartir" por usuario y hora. */
    RATE_LIMIT_SHARES_PER_HOUR: z.coerce.number().int().positive().default(30),
    /** Búsquedas (personas + publicaciones) por usuario y minuto. */
    RATE_LIMIT_SEARCH_PER_MINUTE: z.coerce.number().int().positive().default(30),

    PRIVACY_NOTICE_VERSION: z.string().min(1),

    /** local: MongoDB local (campos normalizados + índice de texto). atlas: Atlas Search ($search). */
    SEARCH_PROVIDER: z.enum(['local', 'atlas']).default('local'),
    ATLAS_SEARCH_USERS_INDEX: z.string().default('users_search'),
    ATLAS_SEARCH_POSTS_INDEX: z.string().default('posts_search'),

    /** URL pública de la API (para construir URLs del almacenamiento en memoria). */
    API_PUBLIC_URL: z.url().default('http://localhost:4000'),

    /**
     * `s3`: MinIO en local o S3/compatible en producción.
     * `memory`: objetos en memoria servidos por la propia API (pruebas y desarrollo sin Docker).
     */
    STORAGE_DRIVER: z.enum(['s3', 'memory']).default('memory'),
    /** Endpoint que usa la API para hablar con S3 (vacío = AWS S3). */
    S3_ENDPOINT: z.string().default(''),
    /** Endpoint que firman las URLs de subida; debe ser alcanzable por los clientes. */
    S3_PRESIGN_ENDPOINT: z.string().default(''),
    /** Base pública de lectura para las variantes procesadas (p. ej. http://localhost:9000/sentio-media). */
    S3_PUBLIC_URL: z.string().default(''),
    S3_REGION: z.string().default('us-east-1'),
    S3_BUCKET: z.string().default('sentio-media'),
    S3_ACCESS_KEY_ID: z.string().default(''),
    S3_SECRET_ACCESS_KEY: z.string().default(''),
    /** MinIO necesita rutas tipo /bucket/key. */
    S3_FORCE_PATH_STYLE: bool.default(true),
  })
  .superRefine((env, ctx) => {
    if (env.STORAGE_DRIVER === 's3' && !env.S3_PUBLIC_URL) {
      ctx.addIssue({
        code: 'custom',
        path: ['S3_PUBLIC_URL'],
        message: 'S3_PUBLIC_URL es obligatoria con STORAGE_DRIVER=s3',
      });
    }
    if (env.STORAGE_DRIVER === 'memory' && env.NODE_ENV === 'production') {
      ctx.addIssue({
        code: 'custom',
        path: ['STORAGE_DRIVER'],
        message: 'STORAGE_DRIVER=memory no se permite en producción',
      });
    }
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

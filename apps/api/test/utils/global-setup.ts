import { randomBytes } from 'node:crypto';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

declare global {
  var __MONGO_REPLSET__: MongoMemoryReplSet | undefined;
}

/**
 * Arranca un MongoDB en memoria (replica set, para transacciones) y fija el entorno de prueba
 * antes de que se cargue cualquier archivo de pruebas: ConfigModule valida el entorno al importarse.
 * Los workers de Jest heredan este process.env.
 */
export default async function globalSetup(): Promise<void> {
  const mongo = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
  globalThis.__MONGO_REPLSET__ = mongo;

  Object.assign(process.env, {
    NODE_ENV: 'test',
    MONGODB_URI: mongo.getUri('sentio_test'),
    REDIS_URL: 'redis://localhost:6379',
    QUEUES_ENABLED: 'false',
    JWT_ACCESS_SECRET: randomBytes(48).toString('base64url'),
    JWT_REFRESH_SECRET: randomBytes(48).toString('base64url'),
    GRAPHQL_PLAYGROUND: 'false',
    PRIVACY_NOTICE_VERSION: 'test-1',
    RATE_LIMIT_AUTH_MAX: '1000',
    RATE_LIMIT_DEFAULT_MAX: '1000',
    STORAGE_DRIVER: 'memory',
    API_PUBLIC_URL: 'http://localhost:4000',
  });
}

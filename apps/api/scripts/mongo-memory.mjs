// MongoDB en memoria (replica set rs0 en localhost:27017) para desarrollar sin Docker.
// Los datos se pierden al detenerlo. Uso: pnpm --filter @sentio/api db:memory
import { MongoMemoryReplSet } from 'mongodb-memory-server';

const replSet = await MongoMemoryReplSet.create({
  replSet: { name: 'rs0', count: 1, storageEngine: 'wiredTiger' },
  instanceOpts: [{ port: 27017, ip: '127.0.0.1' }],
});

console.log(`MongoDB en memoria listo: ${replSet.getUri('sentio')}`);
console.log('Ctrl+C para detenerlo.');

const stop = async () => {
  await replSet.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

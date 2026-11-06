import './global-setup';

/** Detiene el replica set en memoria y borra sus archivos temporales. */
export default async function globalTeardown(): Promise<void> {
  const mongo = globalThis.__MONGO_REPLSET__;
  globalThis.__MONGO_REPLSET__ = undefined;
  await mongo?.stop({ doCleanup: true });
}

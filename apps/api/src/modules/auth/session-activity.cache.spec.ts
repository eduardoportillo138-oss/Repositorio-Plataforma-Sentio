import { type Redis } from 'ioredis';
import {
  MemorySessionActivityCache,
  RedisSessionActivityCache,
  SESSION_ACTIVITY_TTL_SECONDS,
  sessionActivityKey,
} from './session-activity.cache';

describe('MemorySessionActivityCache', () => {
  let now: number;
  const clock = () => now;

  beforeEach(() => {
    now = 1_000_000;
  });

  it('expira las entradas pasado el TTL de 30 s', async () => {
    const cache = new MemorySessionActivityCache(SESSION_ACTIVITY_TTL_SECONDS * 1000, 100, clock);
    await cache.markActive('s1');
    now += 29_999;
    await expect(cache.get('s1')).resolves.toBe(true);
    now += 1;
    await expect(cache.get('s1')).resolves.toBeNull();
  });

  it('markActive no sobrescribe un estado existente; markRevoked sí', async () => {
    const cache = new MemorySessionActivityCache(30_000, 100, clock);
    await cache.markRevoked(['s1']);
    await cache.markActive('s1');
    await expect(cache.get('s1')).resolves.toBe(false);

    await cache.markActive('s2');
    await cache.markRevoked(['s2']);
    await expect(cache.get('s2')).resolves.toBe(false);
  });

  it('no crece por encima del máximo de entradas', async () => {
    const cache = new MemorySessionActivityCache(30_000, 3, clock);
    for (const id of ['a', 'b', 'c', 'd', 'e']) await cache.markActive(id);
    expect(cache.size).toBe(3);
    await expect(cache.get('a')).resolves.toBeNull();
    await expect(cache.get('e')).resolves.toBe(true);
  });
});

/** Redis falso: guarda en un Map o falla en todos los comandos si `down` es true. */
function fakeRedis() {
  const store = new Map<string, string>();
  const state = { down: false };
  const fail = () => Promise.reject(new Error('Connection is closed.'));
  const redis = {
    store,
    state,
    on: jest.fn(),
    get: jest.fn((key: string) => (state.down ? fail() : Promise.resolve(store.get(key) ?? null))),
    set: jest.fn((key: string, value: string, ...args: unknown[]) => {
      if (state.down) return fail();
      if (args.includes('NX') && store.has(key)) return Promise.resolve(null);
      store.set(key, value);
      return Promise.resolve('OK');
    }),
    multi: jest.fn(() => {
      const ops: [string, string][] = [];
      const pipeline = {
        set: (key: string, value: string) => {
          ops.push([key, value]);
          return pipeline;
        },
        exec: () => {
          if (state.down) return fail();
          ops.forEach(([k, v]) => store.set(k, v));
          return Promise.resolve(ops.map(() => [null, 'OK']));
        },
      };
      return pipeline;
    }),
  };
  return redis;
}

describe('RedisSessionActivityCache', () => {
  it('usa claves session:active:<id> con EX 30 y NX al marcar activa', async () => {
    const redis = fakeRedis();
    const cache = new RedisSessionActivityCache(redis as unknown as Redis);

    await cache.markActive('abc');
    expect(redis.set).toHaveBeenCalledWith('session:active:abc', '1', 'EX', 30, 'NX');
    await expect(cache.get('abc')).resolves.toBe(true);

    await cache.markRevoked(['abc']);
    expect(redis.store.get(sessionActivityKey('abc'))).toBe('0');
    await expect(cache.get('abc')).resolves.toBe(false);
  });

  it('si Redis falla cae a memoria y la revocación sigue teniendo efecto local', async () => {
    const redis = fakeRedis();
    const cache = new RedisSessionActivityCache(redis as unknown as Redis);
    redis.state.down = true;

    await expect(cache.get('abc')).resolves.toBeNull();
    await cache.markActive('abc');
    await expect(cache.get('abc')).resolves.toBe(true);

    await cache.markRevoked(['abc']);
    await expect(cache.get('abc')).resolves.toBe(false);
  });
});

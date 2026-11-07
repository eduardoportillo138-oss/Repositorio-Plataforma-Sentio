import { type Redis } from 'ioredis';
import { MemoryRateLimitStore, RedisRateLimitStore } from './rate-limit.store';

describe('MemoryRateLimitStore', () => {
  it('cuenta por clave dentro de la ventana y la reinicia al vencer', async () => {
    let now = 1_000;
    const store = new MemoryRateLimitStore(() => now);
    await expect(store.hit('a', 10)).resolves.toEqual({ count: 1, resetAt: 11_000 });
    await expect(store.hit('a', 10)).resolves.toEqual({ count: 2, resetAt: 11_000 });
    await expect(store.hit('b', 10)).resolves.toMatchObject({ count: 1 });
    now = 11_000;
    await expect(store.hit('a', 10)).resolves.toEqual({ count: 1, resetAt: 21_000 });
  });

  it('no crece sin límite: descarta ventanas vencidas y luego las más antiguas', async () => {
    let now = 0;
    const store = new MemoryRateLimitStore(() => now, 3);
    await store.hit('a', 1);
    await store.hit('b', 1);
    now = 5_000;
    await store.hit('c', 100);
    await store.hit('d', 100);
    await store.hit('e', 100);
    expect(store.size).toBeLessThanOrEqual(3);
    await store.hit('f', 100);
    expect(store.size).toBeLessThanOrEqual(3);
  });
});

function fakeRedis(overrides: Partial<Record<string, unknown>> = {}) {
  const exec = jest.fn().mockResolvedValue([
    [null, 3],
    [null, 1],
    [null, 5_000],
  ]);
  const chain = { incr: () => chain, expire: () => chain, pttl: () => chain, exec };
  const redis = {
    status: 'wait',
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    multi: jest.fn(() => chain),
    quit: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn(),
    ...overrides,
  };
  return { redis, exec };
}

describe('RedisRateLimitStore', () => {
  it('usa INCR + EXPIRE NX + PTTL y conecta perezosamente', async () => {
    const { redis } = fakeRedis();
    const store = new RedisRateLimitStore(redis as unknown as Redis);
    const before = Date.now();
    const hit = await store.hit('createPost:u1', 3600);
    expect(redis.connect).toHaveBeenCalled();
    expect(hit.count).toBe(3);
    expect(hit.resetAt).toBeGreaterThanOrEqual(before + 5_000);
  });

  it('si Redis falla cuenta en memoria', async () => {
    const { redis, exec } = fakeRedis({ status: 'ready' });
    exec.mockRejectedValue(new Error('caído'));
    const store = new RedisRateLimitStore(redis as unknown as Redis);
    await expect(store.hit('k', 60)).resolves.toMatchObject({ count: 1 });
    await expect(store.hit('k', 60)).resolves.toMatchObject({ count: 2 });
    expect(redis.connect).not.toHaveBeenCalled();
  });

  it('tolera respuestas vacías de exec', async () => {
    const { redis, exec } = fakeRedis({ status: 'ready' });
    exec.mockResolvedValueOnce(null);
    const store = new RedisRateLimitStore(redis as unknown as Redis);
    await expect(store.hit('k', 60)).resolves.toMatchObject({ count: 1 });
  });

  it('cierra la conexión al apagar', async () => {
    const ready = fakeRedis({ status: 'ready' });
    await new RedisRateLimitStore(ready.redis as unknown as Redis).onModuleDestroy();
    expect(ready.redis.quit).toHaveBeenCalled();
    const idle = fakeRedis();
    await new RedisRateLimitStore(idle.redis as unknown as Redis).onModuleDestroy();
    expect(idle.redis.disconnect).toHaveBeenCalled();
  });

  it('fromUrl crea un cliente perezoso (sin conectar)', async () => {
    const store = RedisRateLimitStore.fromUrl('redis://127.0.0.1:1');
    await store.onModuleDestroy();
    expect(store).toBeInstanceOf(RedisRateLimitStore);
  });
});

import { Logger, type OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';

export const RATE_LIMIT_STORE = Symbol('RATE_LIMIT_STORE');

export interface RateLimitHit {
  /** Peticiones contadas en la ventana actual (incluida esta). */
  count: number;
  /** Epoch ms en que se reinicia la ventana. */
  resetAt: number;
}

/** Contador de ventana fija por clave (p. ej. `createPost:<userId>`). */
export interface RateLimitStore {
  hit(key: string, windowSeconds: number): Promise<RateLimitHit>;
}

interface Window {
  count: number;
  resetAt: number;
}

/** Contador en memoria del proceso (sin Redis, pruebas y respaldo). */
export class MemoryRateLimitStore implements RateLimitStore {
  private readonly windows = new Map<string, Window>();

  constructor(
    private readonly now: () => number = Date.now,
    private readonly maxEntries = 50_000,
  ) {}

  get size(): number {
    return this.windows.size;
  }

  hit(key: string, windowSeconds: number): Promise<RateLimitHit> {
    const now = this.now();
    let w = this.windows.get(key);
    if (!w || w.resetAt <= now) {
      w = { count: 0, resetAt: now + windowSeconds * 1000 };
      this.windows.set(key, w);
      if (this.windows.size > this.maxEntries) this.evict(now);
    }
    w.count += 1;
    return Promise.resolve({ count: w.count, resetAt: w.resetAt });
  }

  private evict(now: number): void {
    for (const [key, w] of this.windows) if (w.resetAt <= now) this.windows.delete(key);
    for (const key of this.windows.keys()) {
      if (this.windows.size <= this.maxEntries) break;
      this.windows.delete(key);
    }
  }
}

/**
 * Contador compartido entre instancias en Redis (`ratelimit:<clave>`, INCR + EXPIRE NX).
 * Si Redis falla, cuenta en memoria: el límite se aplica por instancia mientras tanto.
 */
export class RedisRateLimitStore implements RateLimitStore, OnModuleDestroy {
  private readonly logger = new Logger(RedisRateLimitStore.name);
  private readonly fallback = new MemoryRateLimitStore();

  constructor(private readonly redis: Redis) {
    this.redis.on('error', (error: Error) => this.logger.warn(`Redis: ${error.message}`));
  }

  static fromUrl(url: string): RedisRateLimitStore {
    return new RedisRateLimitStore(
      new Redis(url, {
        lazyConnect: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        connectionName: 'sentio-api:ratelimit',
      }),
    );
  }

  async hit(key: string, windowSeconds: number): Promise<RateLimitHit> {
    try {
      if (this.redis.status === 'wait') await this.redis.connect();
      const redisKey = `ratelimit:${key}`;
      const results = await this.redis
        .multi()
        .incr(redisKey)
        .expire(redisKey, windowSeconds, 'NX')
        .pttl(redisKey)
        .exec();
      const count = Number(results?.[0]?.[1] ?? 1);
      const ttl = Number(results?.[2]?.[1] ?? windowSeconds * 1000);
      return { count, resetAt: Date.now() + Math.max(ttl, 0) };
    } catch (error) {
      this.logger.warn(`Límite de tasa en memoria (Redis no disponible): ${String(error)}`);
      return this.fallback.hit(key, windowSeconds);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis.status === 'ready') await this.redis.quit();
    else this.redis.disconnect();
  }
}

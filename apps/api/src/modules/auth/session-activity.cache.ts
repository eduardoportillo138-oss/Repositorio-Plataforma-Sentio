import { Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';

/** Cuánto tiempo se confía en el último estado conocido de una sesión. */
export const SESSION_ACTIVITY_TTL_SECONDS = 30;

export const SESSION_ACTIVITY_CACHE = Symbol('SESSION_ACTIVITY_CACHE');

export const sessionActivityKey = (sessionId: string) => `session:active:${sessionId}`;

/**
 * Cache del resultado de `SessionsService.isActive` para no consultar MongoDB en cada petición.
 *
 * Al revocar no basta con borrar la clave: una petición que leyó "activa" justo antes de la
 * revocación podría volver a escribirla. Por eso la revocación escribe "revocada" (sobrescribe)
 * y `markActive` solo escribe si la clave no existe (NX): un "activa" tardío nunca pisa una
 * revocación.
 */
export interface SessionActivityCache {
  /** `true`/`false` si hay un estado vigente en cache; `null` si hay que consultar la BD. */
  get(sessionId: string): Promise<boolean | null>;
  /** Guarda "activa" solo si no hay ya un estado en cache. */
  markActive(sessionId: string): Promise<void>;
  /** Guarda "revocada" para cada sesión, sobrescribiendo cualquier estado anterior. */
  markRevoked(sessionIds: readonly string[]): Promise<void>;
}

interface MemoryEntry {
  active: boolean;
  expiresAt: number;
}

/**
 * Cache local con el mismo TTL. Se usa sin Redis (QUEUES_ENABLED=false, pruebas) y como
 * respaldo cuando Redis no responde. No usa timers: las entradas vencidas se limpian al leer
 * o al superar el tamaño máximo.
 */
export class MemorySessionActivityCache implements SessionActivityCache {
  private readonly entries = new Map<string, MemoryEntry>();

  constructor(
    private readonly ttlMs = SESSION_ACTIVITY_TTL_SECONDS * 1000,
    private readonly maxEntries = 10_000,
    private readonly now: () => number = Date.now,
  ) {}

  get size(): number {
    return this.entries.size;
  }

  get(sessionId: string): Promise<boolean | null> {
    const entry = this.entries.get(sessionId);
    if (!entry) return Promise.resolve(null);
    if (entry.expiresAt <= this.now()) {
      this.entries.delete(sessionId);
      return Promise.resolve(null);
    }
    return Promise.resolve(entry.active);
  }

  async markActive(sessionId: string): Promise<void> {
    if ((await this.get(sessionId)) !== null) return;
    this.write(sessionId, true);
  }

  markRevoked(sessionIds: readonly string[]): Promise<void> {
    for (const id of sessionIds) this.write(id, false);
    return Promise.resolve();
  }

  private write(sessionId: string, active: boolean): void {
    // Reinsertar mueve la clave al final del orden de inserción del Map.
    this.entries.delete(sessionId);
    this.entries.set(sessionId, { active, expiresAt: this.now() + this.ttlMs });
    if (this.entries.size > this.maxEntries) this.evict();
  }

  private evict(): void {
    const now = this.now();
    for (const [id, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(id);
    }
    // Si sigue lleno, descarta las más antiguas.
    for (const id of this.entries.keys()) {
      if (this.entries.size <= this.maxEntries) break;
      this.entries.delete(id);
    }
  }
}

/**
 * Cache compartida entre instancias en Redis (`session:active:<id>`, valor "1"/"0", EX 30).
 * Si Redis falla, cae a la cache en memoria: la revocación sigue siendo inmediata en esta
 * instancia y, como mucho, tarda el TTL en verse en las demás.
 */
export class RedisSessionActivityCache
  implements SessionActivityCache, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RedisSessionActivityCache.name);
  private readonly fallback = new MemorySessionActivityCache();
  private lastErrorLogAt = 0;

  constructor(
    private readonly redis: Redis,
    private readonly ttlSeconds = SESSION_ACTIVITY_TTL_SECONDS,
  ) {
    // Sin listener, ioredis lanzaría los errores de conexión como excepciones no capturadas.
    this.redis.on('error', (error: Error) => this.logFailure(error));
  }

  static fromUrl(url: string): RedisSessionActivityCache {
    return new RedisSessionActivityCache(
      new Redis(url, {
        lazyConnect: true,
        // Sin cola offline: si Redis está caído, los comandos fallan al instante y se usa
        // la cache en memoria en lugar de dejar la petición esperando.
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        connectionName: 'sentio-api:sessions',
      }),
    );
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.redis.connect();
    } catch (error) {
      this.logFailure(error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.redis.quit();
    } catch {
      this.redis.disconnect();
    }
  }

  async get(sessionId: string): Promise<boolean | null> {
    try {
      const value = await this.redis.get(sessionActivityKey(sessionId));
      return value === null ? null : value === '1';
    } catch (error) {
      this.logFailure(error);
      return this.fallback.get(sessionId);
    }
  }

  async markActive(sessionId: string): Promise<void> {
    try {
      await this.redis.set(sessionActivityKey(sessionId), '1', 'EX', this.ttlSeconds, 'NX');
    } catch (error) {
      this.logFailure(error);
      await this.fallback.markActive(sessionId);
    }
  }

  async markRevoked(sessionIds: readonly string[]): Promise<void> {
    if (sessionIds.length === 0) return;
    // La copia local se escribe siempre: protege a esta instancia aunque Redis falle.
    await this.fallback.markRevoked(sessionIds);
    try {
      const pipeline = this.redis.multi();
      for (const id of sessionIds) pipeline.set(sessionActivityKey(id), '0', 'EX', this.ttlSeconds);
      await pipeline.exec();
    } catch (error) {
      this.logFailure(error);
    }
  }

  private logFailure(error: unknown): void {
    const now = Date.now();
    if (now - this.lastErrorLogAt < 60_000) return;
    this.lastErrorLogAt = now;
    const message = error instanceof Error ? error.message : String(error);
    this.logger.warn(`Redis no disponible para la cache de sesiones; uso memoria: ${message}`);
  }
}

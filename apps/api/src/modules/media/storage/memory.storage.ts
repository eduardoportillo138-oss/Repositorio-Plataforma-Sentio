import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  type ObjectStorage,
  type PresignedUpload,
  StorageKeys,
  type StoredObjectInfo,
} from './object-storage';

interface MemoryObject {
  body: Buffer;
  contentType: string;
}

/** Ruta HTTP con la que la API sirve los objetos en memoria (ver MemoryStorageController). */
export const MEMORY_STORAGE_ROUTE = 'storage';

/**
 * Almacenamiento en memoria del proceso. Solo para pruebas y desarrollo local sin Docker:
 * los datos se pierden al reiniciar. Las "URLs prefirmadas" apuntan a la propia API y llevan
 * una firma HMAC con vencimiento, igual que S3, para que los clientes usen el mismo flujo.
 */
export class MemoryStorage implements ObjectStorage {
  private readonly objects = new Map<string, MemoryObject>();

  constructor(
    private readonly baseUrl: string,
    private readonly secret: string,
  ) {}

  presignPut(key: string, contentType: string, expiresInSeconds: number): Promise<PresignedUpload> {
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const sig = this.sign(key, contentType, exp);
    const url = new URL(
      `${this.baseUrl.replace(/\/$/, '')}/${MEMORY_STORAGE_ROUTE}/upload/${encodeURIComponent(key)}`,
    );
    url.searchParams.set('exp', String(exp));
    url.searchParams.set('ct', contentType);
    url.searchParams.set('sig', sig);
    return Promise.resolve({ url: url.toString(), headers: { 'Content-Type': contentType } });
  }

  /** Verifica la firma y el vencimiento de una subida. */
  verifyUpload(key: string, contentType: string, exp: number, sig: string): boolean {
    if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
    const expected = Buffer.from(this.sign(key, contentType, exp));
    const given = Buffer.from(sig);
    return expected.length === given.length && timingSafeEqual(expected, given);
  }

  head(key: string): Promise<StoredObjectInfo | null> {
    const obj = this.objects.get(key);
    return Promise.resolve(obj ? { size: obj.body.length, contentType: obj.contentType } : null);
  }

  get(key: string): Promise<Buffer> {
    const obj = this.objects.get(key);
    if (!obj) return Promise.reject(new Error(`Objeto no encontrado: ${key}`));
    return Promise.resolve(obj.body);
  }

  /** Para servir lecturas públicas desde el controlador. */
  read(key: string): MemoryObject | null {
    return this.objects.get(key) ?? null;
  }

  put(key: string, body: Buffer, contentType: string): Promise<void> {
    this.objects.set(key, { body, contentType });
    return Promise.resolve();
  }

  delete(keys: readonly string[]): Promise<void> {
    for (const key of keys) this.objects.delete(key);
    return Promise.resolve();
  }

  publicUrl(key: string): string {
    return `${this.baseUrl.replace(/\/$/, '')}/${MEMORY_STORAGE_ROUTE}/public/${encodeURIComponent(key)}`;
  }

  isPublicKey(key: string): boolean {
    return key.startsWith(StorageKeys.PUBLIC_PREFIX) && !key.includes('..');
  }

  private sign(key: string, contentType: string, exp: number): string {
    return createHmac('sha256', this.secret)
      .update(`${key}\n${contentType}\n${exp}`)
      .digest('base64url');
  }
}

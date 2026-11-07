/** Metadatos de un objeto almacenado. */
export interface StoredObjectInfo {
  size: number;
  contentType: string | null;
}

/** URL prefirmada de subida y los encabezados que el cliente debe enviar con el PUT. */
export interface PresignedUpload {
  url: string;
  headers: Record<string, string>;
}

/**
 * Almacenamiento de objetos (compatible con S3). Hay dos implementaciones:
 * `S3Storage` (MinIO en local, S3 en producción) y `MemoryStorage` (pruebas y desarrollo sin Docker).
 */
export interface ObjectStorage {
  presignPut(key: string, contentType: string, expiresInSeconds: number): Promise<PresignedUpload>;
  head(key: string): Promise<StoredObjectInfo | null>;
  get(key: string): Promise<Buffer>;
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  delete(keys: readonly string[]): Promise<void>;
  /** URL pública de lectura (solo para claves bajo prefijos públicos, p. ej. `avatars/`). */
  publicUrl(key: string): string;
}

export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE');

/** Prefijos de claves. Los originales son privados; las variantes procesadas, públicas. */
export const StorageKeys = {
  upload: (userId: string, assetId: string) => `uploads/${userId}/${assetId}`,
  avatarVariant: (userId: string, assetId: string, size: number) =>
    `avatars/${userId}/${assetId}-${size}.webp`,
  PUBLIC_PREFIX: 'avatars/',
} as const;

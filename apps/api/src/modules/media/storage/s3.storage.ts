import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { type ObjectStorage, type PresignedUpload, type StoredObjectInfo } from './object-storage';

export interface S3StorageOptions {
  endpoint: string;
  presignEndpoint: string;
  publicUrl: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
}

/** S3 o compatible (MinIO en desarrollo). */
export class S3Storage implements ObjectStorage {
  private readonly client: S3Client;
  /** Cliente aparte para firmar: el host firmado debe ser el que alcanzan los clientes. */
  private readonly presignClient: S3Client;

  constructor(private readonly options: S3StorageOptions) {
    const base = {
      region: options.region,
      forcePathStyle: options.forcePathStyle,
      credentials:
        options.accessKeyId && options.secretAccessKey
          ? { accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey }
          : undefined,
    };
    this.client = new S3Client({ ...base, endpoint: options.endpoint || undefined });
    this.presignClient = new S3Client({
      ...base,
      endpoint: options.presignEndpoint || options.endpoint || undefined,
    });
  }

  async presignPut(
    key: string,
    contentType: string,
    expiresInSeconds: number,
  ): Promise<PresignedUpload> {
    const url = await getSignedUrl(
      this.presignClient,
      new PutObjectCommand({ Bucket: this.options.bucket, Key: key, ContentType: contentType }),
      // Firmar el Content-Type obliga al cliente a subir exactamente el tipo declarado.
      { expiresIn: expiresInSeconds, signableHeaders: new Set(['content-type']) },
    );
    return { url, headers: { 'Content-Type': contentType } };
  }

  async head(key: string): Promise<StoredObjectInfo | null> {
    try {
      const res = await this.client.send(
        new HeadObjectCommand({ Bucket: this.options.bucket, Key: key }),
      );
      return { size: res.ContentLength ?? 0, contentType: res.ContentType ?? null };
    } catch (error) {
      if (error instanceof S3ServiceException && error.$metadata.httpStatusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async get(key: string): Promise<Buffer> {
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.options.bucket, Key: key }),
    );
    if (!res.Body) throw new Error(`Objeto vacío: ${key}`);
    return Buffer.from(await res.Body.transformToByteArray());
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.options.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        // Las variantes tienen nombre único por asset: se pueden cachear para siempre.
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
  }

  async delete(keys: readonly string[]): Promise<void> {
    if (keys.length === 0) return;
    await this.client.send(
      new DeleteObjectsCommand({
        Bucket: this.options.bucket,
        Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
      }),
    );
  }

  publicUrl(key: string): string {
    return `${this.options.publicUrl.replace(/\/$/, '')}/${key}`;
  }
}

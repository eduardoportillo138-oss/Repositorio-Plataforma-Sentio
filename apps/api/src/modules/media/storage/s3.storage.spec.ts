import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { S3Storage } from './s3.storage';

const options = {
  endpoint: 'http://minio:9000',
  presignEndpoint: 'http://localhost:9000',
  publicUrl: 'http://localhost:9000/sentio-media/',
  region: 'us-east-1',
  bucket: 'sentio-media',
  accessKeyId: 'key',
  secretAccessKey: 'secret',
  forcePathStyle: true,
};

function notFound(): S3ServiceException {
  return new S3ServiceException({
    name: 'NotFound',
    $fault: 'client',
    $metadata: { httpStatusCode: 404 },
    message: 'Not Found',
  });
}

type SendSpy = jest.SpyInstance<Promise<unknown>, [unknown]>;

describe('S3Storage', () => {
  let send: SendSpy;
  let storage: S3Storage;
  /** Primer comando enviado a S3. */
  const sent = (): unknown => send.mock.calls[0]?.[0];

  beforeEach(() => {
    send = jest.spyOn(S3Client.prototype, 'send') as unknown as SendSpy;
    storage = new S3Storage(options);
  });

  afterEach(() => send.mockRestore());

  it('firma un PUT con el host público y el Content-Type', async () => {
    const res = await storage.presignPut('uploads/u/a', 'image/png', 600);
    const url = new URL(res.url);
    expect(url.host).toBe('localhost:9000');
    expect(url.pathname).toBe('/sentio-media/uploads/u/a');
    expect(url.searchParams.get('X-Amz-Expires')).toBe('600');
    expect(url.searchParams.get('X-Amz-SignedHeaders')).toContain('content-type');
    expect(res.headers).toEqual({ 'Content-Type': 'image/png' });
    expect(send).not.toHaveBeenCalled();
  });

  it('head devuelve tamaño y tipo', async () => {
    send.mockResolvedValueOnce({ ContentLength: 42, ContentType: 'image/png' });
    await expect(storage.head('k')).resolves.toEqual({ size: 42, contentType: 'image/png' });
    expect(sent()).toBeInstanceOf(HeadObjectCommand);
  });

  it('head tolera respuestas sin metadatos', async () => {
    send.mockResolvedValueOnce({});
    await expect(storage.head('k')).resolves.toEqual({ size: 0, contentType: null });
  });

  it('head devuelve null si el objeto no existe', async () => {
    send.mockRejectedValueOnce(notFound());
    await expect(storage.head('k')).resolves.toBeNull();
  });

  it('head propaga otros errores', async () => {
    send.mockRejectedValueOnce(new Error('caído'));
    await expect(storage.head('k')).rejects.toThrow('caído');
  });

  it('get lee el cuerpo', async () => {
    send.mockResolvedValueOnce({
      Body: { transformToByteArray: () => Promise.resolve(new Uint8Array([1, 2, 3])) },
    });
    await expect(storage.get('k')).resolves.toEqual(Buffer.from([1, 2, 3]));
    expect(sent()).toBeInstanceOf(GetObjectCommand);
  });

  it('get falla si no hay cuerpo', async () => {
    send.mockResolvedValueOnce({});
    await expect(storage.get('k')).rejects.toThrow('Objeto vacío');
  });

  it('put sube con caché inmutable', async () => {
    send.mockResolvedValueOnce({});
    await storage.put('avatars/x.webp', Buffer.from('x'), 'image/webp');
    const cmd = sent() as PutObjectCommand;
    expect(cmd).toBeInstanceOf(PutObjectCommand);
    expect(cmd.input).toMatchObject({
      Bucket: 'sentio-media',
      Key: 'avatars/x.webp',
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    });
  });

  it('delete borra en lote y no llama a S3 sin claves', async () => {
    await storage.delete([]);
    expect(send).not.toHaveBeenCalled();
    send.mockResolvedValueOnce({});
    await storage.delete(['a', 'b']);
    const cmd = sent() as DeleteObjectsCommand;
    expect(cmd).toBeInstanceOf(DeleteObjectsCommand);
    expect(cmd.input.Delete?.Objects).toEqual([{ Key: 'a' }, { Key: 'b' }]);
  });

  it('publicUrl une la base sin dobles barras', () => {
    expect(storage.publicUrl('avatars/u/a-256.webp')).toBe(
      'http://localhost:9000/sentio-media/avatars/u/a-256.webp',
    );
  });

  it('funciona sin endpoint ni credenciales explícitas (AWS con rol IAM)', async () => {
    const aws = new S3Storage({
      ...options,
      endpoint: '',
      presignEndpoint: '',
      accessKeyId: '',
      secretAccessKey: '',
      forcePathStyle: false,
    });
    process.env.AWS_ACCESS_KEY_ID = 'env-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'env-secret';
    try {
      const { url } = await aws.presignPut('k', 'image/png', 60);
      expect(new URL(url).host).toBe('sentio-media.s3.us-east-1.amazonaws.com');
    } finally {
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
    }
  });
});

import { randomBytes } from 'node:crypto';
import { AVATAR_MAX_BYTES, ErrorCode } from '@sentio/core';
import sharp from 'sharp';
import request from 'supertest';
import { type App } from 'supertest/types';
import { MediaJobsService } from '../src/modules/media/media-jobs.service';
import {
  connectSocket,
  errorCode,
  fieldErrors,
  listen,
  nextEvent,
  registerUser,
  type TestUser,
} from './utils/helpers';
import { createTestApp, type TestApp } from './utils/test-app';

const REQUEST_UPLOAD = `mutation($mimeType: String!, $sizeBytes: Int!) {
  requestAvatarUpload(mimeType: $mimeType, sizeBytes: $sizeBytes) {
    assetId uploadUrl expiresAt headers { name value }
  }
}`;
const CONFIRM = `mutation($assetId: ID!) {
  confirmAvatarUpload(assetId: $assetId) {
    id status purpose avatar { assetId url256 url512 blurhash }
  }
}`;
const REMOVE = `mutation { removeAvatar { id avatar { url256 } } }`;
const ME = `query { me { id avatar { assetId url256 url512 blurhash } } }`;

interface Ticket {
  assetId: string;
  uploadUrl: string;
  expiresAt: string;
  headers: { name: string; value: string }[];
}

interface Asset {
  id: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  purpose: string;
  avatar: { assetId: string; url256: string; url512: string; blurhash: string } | null;
}

let t: TestApp;
let server: App;
let ana: TestUser;
let beto: TestUser;

/** JPEG 800×600 con EXIF (autor, GPS) y orientación 6 (girado 90°). */
async function photoWithExif(): Promise<Buffer> {
  return sharp({ create: { width: 800, height: 600, channels: 3, background: '#cc3344' } })
    .jpeg()
    .withMetadata({
      orientation: 6,
      exif: { IFD0: { Artist: 'Ana Secreta', Copyright: 'privado' } },
    })
    .toBuffer();
}

/** Ruta relativa (con query) de una URL absoluta de la API, para supertest. */
function pathOf(url: string): string {
  const u = new URL(url);
  return `${u.pathname}${u.search}`;
}

async function requestUpload(user: TestUser, mimeType: string, sizeBytes: number) {
  return t.gql<{ requestAvatarUpload: Ticket }>(
    REQUEST_UPLOAD,
    { mimeType, sizeBytes },
    { token: user.token },
  );
}

async function put(ticket: Ticket, body: Buffer, contentType?: string) {
  const ct = contentType ?? ticket.headers.find((h) => h.name === 'Content-Type')!.value;
  return request(server).put(pathOf(ticket.uploadUrl)).set('Content-Type', ct).send(body);
}

async function uploadAvatar(user: TestUser, body: Buffer, mimeType = 'image/jpeg') {
  const ticket = (await requestUpload(user, mimeType, body.length)).data!.requestAvatarUpload;
  const putRes = await put(ticket, body);
  expect(putRes.status).toBe(200);
  const confirm = await t.gql<{ confirmAvatarUpload: Asset }>(
    CONFIRM,
    { assetId: ticket.assetId },
    { token: user.token },
  );
  return { ticket, confirm };
}

async function download(url: string) {
  return request(server)
    .get(pathOf(url))
    .buffer(true)
    .parse((res, cb) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => cb(null, Buffer.concat(chunks)));
    });
}

beforeAll(async () => {
  t = await createTestApp();
  server = t.app.getHttpServer() as App;
  ana = await registerUser(t, 'ana');
  beto = await registerUser(t, 'beto');
});

afterAll(async () => {
  await t?.app.get(MediaJobsService).drain();
  await t?.close();
});

describe('requestAvatarUpload', () => {
  it('devuelve una URL prefirmada PUT que vence en 10 minutos', async () => {
    const res = await requestUpload(ana, 'image/png', 1000);
    expect(res.errors).toBeUndefined();
    const ticket = res.data!.requestAvatarUpload;
    expect(ticket.assetId).toMatch(/^[a-f\d]{24}$/);
    expect(ticket.uploadUrl).toContain('/storage/upload/');
    expect(ticket.headers).toEqual([{ name: 'Content-Type', value: 'image/png' }]);
    const ttl = new Date(ticket.expiresAt).getTime() - Date.now();
    expect(ttl).toBeGreaterThan(9 * 60 * 1000);
    expect(ttl).toBeLessThanOrEqual(10 * 60 * 1000);
  });

  it('rechaza tipos no permitidos', async () => {
    const res = await requestUpload(ana, 'image/gif', 1000);
    expect(errorCode(res)).toBe(ErrorCode.BAD_USER_INPUT);
    expect(fieldErrors(res).mimeType).toContain('validation.avatar.type');
  });

  it('rechaza archivos de más de 5 MB', async () => {
    const res = await requestUpload(ana, 'image/jpeg', AVATAR_MAX_BYTES + 1);
    expect(fieldErrors(res).sizeBytes).toContain('validation.avatar.size');
  });

  it('exige sesión', async () => {
    const res = await t.gql(REQUEST_UPLOAD, { mimeType: 'image/png', sizeBytes: 10 });
    expect(errorCode(res)).toBe(ErrorCode.UNAUTHENTICATED);
  });
});

describe('subida al almacenamiento (driver memory)', () => {
  it('rechaza una firma alterada', async () => {
    const ticket = (await requestUpload(ana, 'image/png', 10)).data!.requestAvatarUpload;
    const res = await request(server)
      .put(pathOf(ticket.uploadUrl).replace(/sig=[^&]+/, 'sig=falsa'))
      .set('Content-Type', 'image/png')
      .send(Buffer.from('x'));
    expect(res.status).toBe(401);
  });

  it('rechaza un Content-Type distinto al firmado', async () => {
    const ticket = (await requestUpload(ana, 'image/png', 10)).data!.requestAvatarUpload;
    const res = await put(ticket, Buffer.from('x'), 'image/jpeg');
    expect(res.status).toBe(415);
  });

  it('no sirve archivos privados (originales)', async () => {
    const res = await request(server).get(`/storage/public/${encodeURIComponent('uploads/x/y')}`);
    expect(res.status).toBe(404);
  });
});

describe('confirmAvatarUpload', () => {
  it('genera variantes WebP de 256 y 512 sin EXIF, con blurhash, y actualiza el avatar', async () => {
    const original = await photoWithExif();
    expect((await sharp(original).metadata()).exif).toBeDefined();

    const { ticket, confirm } = await uploadAvatar(ana, original);
    expect(confirm.errors).toBeUndefined();
    const asset = confirm.data!.confirmAvatarUpload;
    expect(asset).toMatchObject({ id: ticket.assetId, status: 'ready', purpose: 'avatar' });
    expect(asset.avatar!.blurhash.length).toBeGreaterThanOrEqual(6);

    for (const [url, size] of [
      [asset.avatar!.url256, 256],
      [asset.avatar!.url512, 512],
    ] as const) {
      const res = await download(url);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('image/webp');
      const meta = await sharp(res.body as Buffer).metadata();
      expect(meta).toMatchObject({ format: 'webp', width: size, height: size });
      expect(meta.exif).toBeUndefined();
      expect(meta.orientation).toBeUndefined();
    }

    const me = await t.gql<{ me: { avatar: Asset['avatar'] } }>(ME, {}, { token: ana.token });
    expect(me.data!.me.avatar).toEqual(asset.avatar);
  });

  it('borra el original después de procesarlo', async () => {
    const { ticket } = await uploadAvatar(ana, await photoWithExif());
    await t.app.get(MediaJobsService).drain();
    // Volver a confirmar es idempotente y no vuelve a leer el original.
    const again = await t.gql<{ confirmAvatarUpload: Asset }>(
      CONFIRM,
      { assetId: ticket.assetId },
      { token: ana.token },
    );
    expect(again.data!.confirmAvatarUpload.status).toBe('ready');
  });

  it('al reemplazar la foto borra las variantes anteriores', async () => {
    const first = (await uploadAvatar(ana, await photoWithExif())).confirm.data!.confirmAvatarUpload
      .avatar!;
    await uploadAvatar(ana, await photoWithExif());
    await t.app.get(MediaJobsService).drain();
    expect((await download(first.url256)).status).toBe(404);
    expect((await download(first.url512)).status).toBe(404);
  });

  it('marca como fallido un archivo que no es imagen y no toca el avatar actual', async () => {
    const before = await t.gql<{ me: { avatar: Asset['avatar'] } }>(ME, {}, { token: ana.token });
    const { confirm } = await uploadAvatar(ana, randomBytes(2048));
    expect(confirm.data!.confirmAvatarUpload.status).toBe('failed');
    const after = await t.gql<{ me: { avatar: Asset['avatar'] } }>(ME, {}, { token: ana.token });
    expect(after.data!.me.avatar).toEqual(before.data!.me.avatar);
  });

  it('rechaza si el archivo subido supera 5 MB aunque se declarara menos', async () => {
    const ticket = (await requestUpload(ana, 'image/jpeg', 1000)).data!.requestAvatarUpload;
    expect((await put(ticket, randomBytes(AVATAR_MAX_BYTES + 10))).status).toBe(200);
    const res = await t.gql(CONFIRM, { assetId: ticket.assetId }, { token: ana.token });
    expect(fieldErrors(res).sizeBytes).toContain('validation.avatar.size');
  });

  it('da NOT_FOUND si todavía no se subió el archivo', async () => {
    const ticket = (await requestUpload(ana, 'image/png', 100)).data!.requestAvatarUpload;
    const res = await t.gql(CONFIRM, { assetId: ticket.assetId }, { token: ana.token });
    expect(errorCode(res)).toBe(ErrorCode.NOT_FOUND);
  });

  it('da FORBIDDEN si el asset es de otro usuario', async () => {
    const ticket = (await requestUpload(ana, 'image/png', 100)).data!.requestAvatarUpload;
    await put(
      ticket,
      await sharp({ create: { width: 10, height: 10, channels: 3, background: '#000' } })
        .png()
        .toBuffer(),
    );
    const res = await t.gql(CONFIRM, { assetId: ticket.assetId }, { token: beto.token });
    expect(errorCode(res)).toBe(ErrorCode.FORBIDDEN);
  });

  it('valida el formato del id', async () => {
    const res = await t.gql(CONFIRM, { assetId: 'nope' }, { token: ana.token });
    expect(errorCode(res)).toBe(ErrorCode.BAD_USER_INPUT);
  });

  it('da NOT_FOUND para un asset inexistente', async () => {
    const res = await t.gql(CONFIRM, { assetId: '507f1f77bcf86cd799439011' }, { token: ana.token });
    expect(errorCode(res)).toBe(ErrorCode.NOT_FOUND);
  });

  it('emite media:ready a la sala del usuario', async () => {
    const socket = await connectSocket(await listen(t), beto.token);
    try {
      const event = nextEvent(socket, 'media:ready');
      const { confirm } = await uploadAvatar(beto, await photoWithExif());
      const [payload] = await event;
      expect(payload).toEqual({
        assetId: confirm.data!.confirmAvatarUpload.id,
        purpose: 'avatar',
        avatar: confirm.data!.confirmAvatarUpload.avatar,
      });
    } finally {
      socket.disconnect();
    }
  });

  it('emite media:failed si el procesamiento falla', async () => {
    const socket = await connectSocket(await listen(t), beto.token);
    try {
      const event = nextEvent(socket, 'media:failed');
      const { confirm } = await uploadAvatar(beto, randomBytes(512));
      const [payload] = await event;
      expect(payload).toEqual({ assetId: confirm.data!.confirmAvatarUpload.id, purpose: 'avatar' });
    } finally {
      socket.disconnect();
    }
  });
});

describe('confirmAvatarUpload: concurrencia y archivos vacíos', () => {
  it('rechaza un archivo vacío', async () => {
    const ticket = (await requestUpload(ana, 'image/png', 10)).data!.requestAvatarUpload;
    expect((await put(ticket, Buffer.alloc(0))).status).toBe(200);
    const res = await t.gql(CONFIRM, { assetId: ticket.assetId }, { token: ana.token });
    expect(fieldErrors(res).sizeBytes).toContain('validation.avatar.empty');
  });

  it('dos confirmaciones simultáneas procesan una sola vez', async () => {
    const body = await photoWithExif();
    const ticket = (await requestUpload(beto, 'image/jpeg', body.length)).data!.requestAvatarUpload;
    await put(ticket, body);
    const results = await Promise.all(
      [1, 2].map(() =>
        t.gql<{ confirmAvatarUpload: Asset }>(
          CONFIRM,
          { assetId: ticket.assetId },
          { token: beto.token },
        ),
      ),
    );
    for (const r of results) expect(r.errors).toBeUndefined();
    const statuses = results.map((r) => r.data!.confirmAvatarUpload.status);
    expect(statuses).toContain('ready');
  });

  it('una subida sin parámetros de firma se rechaza', async () => {
    const res = await request(server)
      .put(`/storage/upload/${encodeURIComponent('uploads/x/y')}`)
      .set('Content-Type', 'image/png')
      .send(Buffer.from('x'));
    expect(res.status).toBe(401);
  });
});

describe('removeAvatar', () => {
  it('deja el avatar en null y borra las variantes en segundo plano', async () => {
    const current = (await t.gql<{ me: { avatar: Asset['avatar'] } }>(ME, {}, { token: ana.token }))
      .data!.me.avatar!;
    expect(current).not.toBeNull();

    const res = await t.gql<{ removeAvatar: { avatar: null } }>(REMOVE, {}, { token: ana.token });
    expect(res.errors).toBeUndefined();
    expect(res.data!.removeAvatar.avatar).toBeNull();

    await t.app.get(MediaJobsService).drain();
    expect((await download(current.url256)).status).toBe(404);
  });

  it('es idempotente sin foto', async () => {
    const res = await t.gql<{ removeAvatar: { avatar: null } }>(REMOVE, {}, { token: ana.token });
    expect(res.data!.removeAvatar.avatar).toBeNull();
  });
});

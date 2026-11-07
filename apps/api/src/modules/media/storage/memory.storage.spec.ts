import { MemoryStorage } from './memory.storage';

describe('MemoryStorage', () => {
  const storage = new MemoryStorage('http://api.test/', 'secreto');

  function sigParams(url: string) {
    const u = new URL(url);
    return {
      key: decodeURIComponent(u.pathname.split('/').pop()!),
      ct: u.searchParams.get('ct')!,
      exp: Number(u.searchParams.get('exp')),
      sig: u.searchParams.get('sig')!,
    };
  }

  it('firma subidas que solo valen para la misma clave, tipo y vigencia', async () => {
    const { url } = await storage.presignPut('uploads/u/a', 'image/png', 60);
    const p = sigParams(url);
    expect(url.startsWith('http://api.test/storage/upload/')).toBe(true);
    expect(storage.verifyUpload(p.key, p.ct, p.exp, p.sig)).toBe(true);
    expect(storage.verifyUpload('uploads/u/b', p.ct, p.exp, p.sig)).toBe(false);
    expect(storage.verifyUpload(p.key, 'image/jpeg', p.exp, p.sig)).toBe(false);
    expect(storage.verifyUpload(p.key, p.ct, p.exp + 1, p.sig)).toBe(false);
    expect(storage.verifyUpload(p.key, p.ct, p.exp, 'corta')).toBe(false);
  });

  it('rechaza firmas vencidas o con vencimiento inválido', async () => {
    const { url } = await storage.presignPut('k', 'image/png', -1);
    const p = sigParams(url);
    expect(storage.verifyUpload(p.key, p.ct, p.exp, p.sig)).toBe(false);
    expect(storage.verifyUpload(p.key, p.ct, Number.NaN, p.sig)).toBe(false);
  });

  it('guarda, lee, describe y borra objetos', async () => {
    await storage.put('avatars/u/x.webp', Buffer.from('hola'), 'image/webp');
    await expect(storage.head('avatars/u/x.webp')).resolves.toEqual({
      size: 4,
      contentType: 'image/webp',
    });
    await expect(storage.get('avatars/u/x.webp')).resolves.toEqual(Buffer.from('hola'));
    expect(storage.read('avatars/u/x.webp')?.contentType).toBe('image/webp');
    await storage.delete(['avatars/u/x.webp']);
    await expect(storage.head('avatars/u/x.webp')).resolves.toBeNull();
    await expect(storage.get('avatars/u/x.webp')).rejects.toThrow('no encontrado');
    expect(storage.read('avatars/u/x.webp')).toBeNull();
  });

  it('solo considera públicas las claves bajo avatars/ sin saltos de ruta', () => {
    expect(storage.isPublicKey('avatars/u/a-256.webp')).toBe(true);
    expect(storage.isPublicKey('uploads/u/a')).toBe(false);
    expect(storage.isPublicKey('avatars/../uploads/u/a')).toBe(false);
    expect(storage.publicUrl('avatars/u/a.webp')).toBe(
      'http://api.test/storage/public/avatars%2Fu%2Fa.webp',
    );
  });
});

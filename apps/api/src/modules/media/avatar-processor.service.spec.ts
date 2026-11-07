import { decode } from 'blurhash';
import sharp from 'sharp';
import { AVATAR_SIZES, avatarVariantKeys, processAvatarImage } from './avatar-processor.service';

describe('processAvatarImage', () => {
  it('genera variantes cuadradas WebP sin metadatos y un blurhash decodificable', async () => {
    const input = await sharp({
      create: { width: 300, height: 200, channels: 3, background: '#3366cc' },
    })
      .png()
      .toBuffer();

    const out = await processAvatarImage(input);
    expect(out.variants.map((v) => v.size)).toEqual([...AVATAR_SIZES]);
    for (const v of out.variants) {
      const meta = await sharp(v.body).metadata();
      expect(meta).toMatchObject({ format: 'webp', width: v.size, height: v.size });
      expect(meta.exif).toBeUndefined();
    }
    expect(decode(out.blurhash, 8, 8)).toHaveLength(8 * 8 * 4);
    expect(out).toMatchObject({ width: 300, height: 200 });
  });

  it('aplica la orientación EXIF e intercambia ancho y alto', async () => {
    const input = await sharp({
      create: { width: 300, height: 200, channels: 3, background: '#000' },
    })
      .jpeg()
      .withMetadata({ orientation: 8 })
      .toBuffer();
    await expect(processAvatarImage(input)).resolves.toMatchObject({ width: 200, height: 300 });
  });

  it('falla con datos que no son imagen', async () => {
    await expect(processAvatarImage(Buffer.from('no soy una imagen'))).rejects.toThrow();
  });
});

describe('avatarVariantKeys', () => {
  it('lista las claves de todas las variantes', () => {
    expect(avatarVariantKeys('u1', 'a1')).toEqual([
      'avatars/u1/a1-256.webp',
      'avatars/u1/a1-512.webp',
    ]);
  });
});

import * as argon2 from 'argon2';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('genera hashes Argon2id con los parámetros de OWASP', async () => {
    const hash = await service.hash('contrasena123');
    expect(hash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
  });

  it('verifica la contraseña correcta y rechaza la incorrecta', async () => {
    const hash = await service.hash('contrasena123');
    await expect(service.verify(hash, 'contrasena123')).resolves.toBe(true);
    await expect(service.verify(hash, 'otra-cosa')).resolves.toBe(false);
  });

  it('no lanza con hashes corruptos', async () => {
    await expect(service.verify('no-es-un-hash', 'x')).resolves.toBe(false);
  });

  it('marca para rehash los hashes con parámetros más débiles', async () => {
    const weak = await argon2.hash('x', { type: argon2.argon2id, memoryCost: 4096, timeCost: 1 });
    expect(service.needsRehash(weak)).toBe(true);
    expect(service.needsRehash(await service.hash('x'))).toBe(false);
  });

  it('verifyDummy siempre devuelve false', async () => {
    await expect(service.verifyDummy('lo-que-sea')).resolves.toBe(false);
  });
});

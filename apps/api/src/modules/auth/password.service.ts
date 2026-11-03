import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

/** Parámetros mínimos recomendados por OWASP para Argon2id (19 MiB, 2 iteraciones, 1 hilo). */
export const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

@Injectable()
export class PasswordService {
  private dummyHash: Promise<string> | null = null;

  hash(password: string): Promise<string> {
    return argon2.hash(password, ARGON2_OPTIONS);
  }

  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  /** `true` si el hash se creó con parámetros más débiles que los actuales. */
  needsRehash(hash: string): boolean {
    return argon2.needsRehash(hash, ARGON2_OPTIONS);
  }

  /**
   * Verifica contra un hash ficticio cuando el usuario no existe, para que el tiempo de respuesta
   * no revele qué correos están registrados.
   */
  async verifyDummy(password: string): Promise<false> {
    this.dummyHash ??= this.hash('sentio-dummy-password-for-timing');
    await this.verify(await this.dummyHash, password);
    return false;
  }
}

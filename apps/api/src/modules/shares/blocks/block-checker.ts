import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { type Connection, Types } from 'mongoose';

/** Nombre de la colección de bloqueos: `{ blockerId, blockedId, createdAt }`. */
export const BLOCKS_COLLECTION = 'blocks';

/**
 * Verificación de bloqueos entre usuarios. La colección `blocks` todavía no tiene módulo
 * propio (ni UI para bloquear); se consulta directamente y, si no existe, no hay bloqueos.
 * Cuando exista el módulo de bloqueos, solo cambia esta clase.
 */
@Injectable()
export class BlockChecker {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  /** De estos usuarios, cuáles bloquearon a `userId`. */
  async blockedBy(userId: string, candidateIds: readonly string[]): Promise<Set<string>> {
    const ids = candidateIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (ids.length === 0) return new Set();
    const docs = await this.connection
      .collection<{ blockerId: Types.ObjectId; blockedId: Types.ObjectId }>(BLOCKS_COLLECTION)
      .find(
        { blockedId: new Types.ObjectId(userId), blockerId: { $in: ids } },
        { projection: { blockerId: 1 } },
      )
      .toArray();
    return new Set(docs.map((d) => d.blockerId.toHexString()));
  }
}

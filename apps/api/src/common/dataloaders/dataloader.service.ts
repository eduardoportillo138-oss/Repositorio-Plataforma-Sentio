import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { type UserDocumentLean } from '../../modules/users/schemas/user.schema';
import { UsersService } from '../../modules/users/users.service';

export interface Loaders {
  userById: DataLoader<string, UserDocumentLean | null>;
}

/**
 * Fábrica de DataLoaders. Se crea un juego nuevo por request (en el contexto GraphQL),
 * así la caché nunca se comparte entre usuarios.
 */
@Injectable()
export class DataloaderService {
  constructor(private readonly users: UsersService) {}

  createLoaders(): Loaders {
    return {
      userById: new DataLoader<string, UserDocumentLean | null>(async (ids) => {
        const docs = await this.users.findByIds(ids);
        const byId = new Map(docs.map((d) => [d._id.toHexString(), d]));
        return ids.map((id) => byId.get(id) ?? null);
      }),
    };
  }
}

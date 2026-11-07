import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PostsService } from '../../modules/posts/posts.service';
import { type Post } from '../../modules/posts/schemas/post.schema';
import { ReactionsService } from '../../modules/reactions/reactions.service';
import { type UserDocumentLean } from '../../modules/users/schemas/user.schema';
import { UsersService } from '../../modules/users/users.service';
import { type AppRequest } from '../graphql/context';

export interface Loaders {
  userById: DataLoader<string, UserDocumentLean | null>;
  postById: DataLoader<string, Post | null>;
  /** ¿El usuario de la request le dio "Me gusta" a este post? Una consulta por página. */
  viewerLikedPostIds: DataLoader<string, boolean>;
}

/**
 * Fábrica de DataLoaders. Se crea un juego nuevo por request (en el contexto GraphQL),
 * así la caché nunca se comparte entre usuarios.
 */
@Injectable()
export class DataloaderService {
  constructor(
    private readonly users: UsersService,
    private readonly posts: PostsService,
    private readonly reactions: ReactionsService,
  ) {}

  /**
   * `req` se lee al ejecutar cada lote, no al crear los loaders: el contexto se construye
   * antes de que el guard de autenticación adjunte `req.user`.
   */
  createLoaders(req?: AppRequest): Loaders {
    return {
      userById: new DataLoader<string, UserDocumentLean | null>(async (ids) => {
        const docs = await this.users.findByIds(ids);
        const byId = new Map(docs.map((d) => [d._id.toHexString(), d]));
        return ids.map((id) => byId.get(id) ?? null);
      }),
      postById: new DataLoader<string, Post | null>(async (ids) => {
        const docs = await this.posts.findByIds(ids);
        const byId = new Map(docs.map((d) => [d._id.toHexString(), d]));
        return ids.map((id) => byId.get(id) ?? null);
      }),
      viewerLikedPostIds: new DataLoader<string, boolean>(async (postIds) => {
        const userId = req?.user?.userId;
        if (!userId) return postIds.map(() => false);
        const liked = await this.reactions.likedPostIds(userId, postIds);
        return postIds.map((id) => liked.has(id));
      }),
    };
  }
}

import { escapeRegex } from '@sentio/core';
import { type FilterQuery, type Model } from 'mongoose';
import { type Connection } from '../../../common/pagination/connection.type';
import { paginate } from '../../../common/pagination/paginate';
import { type PostModel, toPostModel } from '../../posts/dto/post.dto';
import { type Post } from '../../posts/schemas/post.schema';
import { type PublicUserModel, toPublicUser } from '../../users/dto/public-user.model';
import { type User } from '../../users/schemas/user.schema';
import { type SearchPageArgs, type SearchProvider, searchTokens } from './search-provider';

const EMPTY: Connection<never> = {
  edges: [],
  pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null },
};

/** Coincide con el inicio de cualquier palabra del campo normalizado. */
const wordPrefix = (token: string) => ({ $regex: `(^| )${escapeRegex(token)}` });

/** Filtro de personas: cada palabra de la consulta es prefijo de alguna palabra del nombre o handle. */
export function userSearchFilter(query: string): FilterQuery<User> | null {
  const tokens = searchTokens(query);
  if (tokens.length === 0) return null;
  return { status: 'active', $and: tokens.map((t) => ({ searchName: wordPrefix(t) })) };
}

/**
 * Filtro de publicaciones públicas y activas. Las palabras completas (todas menos la última)
 * se resuelven con el índice de texto; la última, que puede estar a medio escribir, por prefijo
 * en el título o la descripción.
 */
export function postSearchFilter(query: string): FilterQuery<Post> | null {
  const tokens = searchTokens(query);
  const last = tokens.at(-1);
  if (!last) return null;
  const complete = tokens.slice(0, -1);
  return {
    status: 'active',
    visibility: 'public',
    groupId: null,
    ...(complete.length > 0
      ? { $text: { $search: complete.map((t) => `"${t.replace(/"/g, '')}"`).join(' ') } }
      : {}),
    $or: [{ searchTitle: wordPrefix(last) }, { searchText: wordPrefix(last) }],
  };
}

/** Búsqueda para desarrollo con MongoDB local: campos normalizados, índice de texto y prefijos. */
export class LocalSearchProvider implements SearchProvider {
  constructor(
    private readonly users: Model<User>,
    private readonly posts: Model<Post>,
  ) {}

  async searchUsers(query: string, args: SearchPageArgs): Promise<Connection<PublicUserModel>> {
    const filter = userSearchFilter(query);
    if (!filter) return EMPTY;
    return paginate(this.users, toPublicUser, {
      filter,
      sortField: 'handle',
      direction: 1,
      first: args.first,
      after: args.after,
    });
  }

  async searchPosts(query: string, args: SearchPageArgs): Promise<Connection<PostModel>> {
    const filter = postSearchFilter(query);
    if (!filter) return EMPTY;
    return paginate(this.posts, toPostModel, {
      filter,
      sortField: 'createdAt',
      direction: -1,
      first: args.first,
      after: args.after,
    });
  }
}

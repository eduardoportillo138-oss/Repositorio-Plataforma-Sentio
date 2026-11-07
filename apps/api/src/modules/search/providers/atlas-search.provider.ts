import { type Model, type PipelineStage } from 'mongoose';
import { Errors } from '../../../common/errors/app-error';
import {
  type Connection,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '../../../common/pagination/connection.type';
import { decodeCursor, encodeCursor } from '../../../common/pagination/cursor';
import { type PostModel, toPostModel } from '../../posts/dto/post.dto';
import { type Post } from '../../posts/schemas/post.schema';
import { type PublicUserModel, toPublicUser } from '../../users/dto/public-user.model';
import { type User, type UserDocumentLean } from '../../users/schemas/user.schema';
import { type SearchPageArgs, type SearchProvider, searchTokens } from './search-provider';

/** Marca del cursor: el id guarda el `searchSequenceToken` de Atlas. */
const ATLAS_CURSOR_KEY = 'atlas';

export interface AtlasSearchIndexes {
  users: string;
  posts: string;
}

type WithToken<T> = T & { _searchToken: string };

/**
 * Búsqueda en producción con Atlas Search ($search): autocompletado sobre los campos
 * normalizados y paginación con `searchAfter`. Las definiciones de índice están en
 * infra/atlas-search/. Requiere un clúster de Atlas (no funciona con MongoDB local).
 */
export class AtlasSearchProvider implements SearchProvider {
  constructor(
    private readonly users: Model<User>,
    private readonly posts: Model<Post>,
    private readonly indexes: AtlasSearchIndexes,
  ) {}

  /** Pipeline de personas (público para pruebas). */
  usersPipeline(query: string, first: number, after: string | null): PipelineStage[] {
    return this.pipeline(
      {
        index: this.indexes.users,
        compound: {
          must: searchTokens(query).map((t) => ({
            autocomplete: { query: t, path: 'searchName' },
          })),
          filter: [{ equals: { path: 'status', value: 'active' } }],
        },
        sort: { handle: 1 },
      },
      first,
      after,
    );
  }

  /** Pipeline de publicaciones públicas y activas (público para pruebas). */
  postsPipeline(query: string, first: number, after: string | null): PipelineStage[] {
    return this.pipeline(
      {
        index: this.indexes.posts,
        compound: {
          must: searchTokens(query).map((t) => ({
            compound: {
              should: [
                { autocomplete: { query: t, path: 'searchTitle', score: { boost: { value: 3 } } } },
                { autocomplete: { query: t, path: 'searchText' } },
              ],
              minimumShouldMatch: 1,
            },
          })),
          filter: [
            { equals: { path: 'status', value: 'active' } },
            { equals: { path: 'visibility', value: 'public' } },
          ],
        },
        sort: { createdAt: -1, _id: -1 },
      },
      first,
      after,
    );
  }

  async searchUsers(query: string, args: SearchPageArgs): Promise<Connection<PublicUserModel>> {
    const { first, after } = this.page(args);
    const docs = await this.users
      .aggregate<WithToken<UserDocumentLean>>(this.usersPipeline(query, first, after))
      .exec();
    return this.connection(docs, first, Boolean(after), toPublicUser);
  }

  async searchPosts(query: string, args: SearchPageArgs): Promise<Connection<PostModel>> {
    const { first, after } = this.page(args);
    const docs = await this.posts
      .aggregate<WithToken<Post>>(this.postsPipeline(query, first, after))
      .exec();
    return this.connection(docs, first, Boolean(after), toPostModel);
  }

  private pipeline(
    search: Record<string, unknown>,
    first: number,
    after: string | null,
  ): PipelineStage[] {
    return [
      { $search: { ...search, ...(after ? { searchAfter: after } : {}) } },
      { $limit: first + 1 },
      // Los campos de búsqueda nunca salen del servidor.
      { $project: { searchName: 0, searchTitle: 0, searchText: 0, passwordHash: 0 } },
      { $addFields: { _searchToken: { $meta: 'searchSequenceToken' } } },
    ];
  }

  private page(args: SearchPageArgs): { first: number; after: string | null } {
    const first = args.first ?? DEFAULT_PAGE_SIZE;
    if (first < 1 || first > MAX_PAGE_SIZE) {
      throw Errors.badInput(`"first" debe estar entre 1 y ${MAX_PAGE_SIZE}.`);
    }
    if (!args.after) return { first, after: null };
    const { key, id } = decodeCursor(args.after);
    if (key !== ATLAS_CURSOR_KEY) throw Errors.badInput('Cursor de paginación inválido.');
    return { first, after: id };
  }

  private connection<D extends { _searchToken: string }, N>(
    docs: D[],
    first: number,
    hasPrevious: boolean,
    toNode: (doc: D) => N,
  ): Connection<N> {
    const hasNextPage = docs.length > first;
    const page = hasNextPage ? docs.slice(0, first) : docs;
    const edges = page.map((doc) => ({
      cursor: encodeCursor({ key: ATLAS_CURSOR_KEY, id: doc._searchToken }),
      node: toNode(doc),
    }));
    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: hasPrevious,
        startCursor: edges[0]?.cursor ?? null,
        endCursor: edges.at(-1)?.cursor ?? null,
      },
    };
  }
}

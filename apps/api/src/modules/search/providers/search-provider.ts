import { type Connection } from '../../../common/pagination/connection.type';
import { type PostModel } from '../../posts/dto/post.dto';
import { type PublicUserModel } from '../../users/dto/public-user.model';

export interface SearchPageArgs {
  first?: number | null;
  after?: string | null;
}

/**
 * Motor de búsqueda intercambiable (SEARCH_PROVIDER=local|atlas).
 * `query` llega ya validada y normalizada (minúsculas, sin acentos, espacios colapsados).
 * Las implementaciones devuelven solo datos públicos y solo publicaciones públicas y activas.
 */
export interface SearchProvider {
  searchUsers(query: string, args: SearchPageArgs): Promise<Connection<PublicUserModel>>;
  searchPosts(query: string, args: SearchPageArgs): Promise<Connection<PostModel>>;
}

export const SEARCH_PROVIDER = Symbol('SEARCH_PROVIDER');

/** Palabras de la consulta, sin el @ inicial de los handles. */
export function searchTokens(query: string): string[] {
  return query
    .split(' ')
    .map((t) => t.replace(/^@+/, ''))
    .filter(Boolean);
}

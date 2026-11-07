import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { type AuthUser } from '../../common/graphql/context';
import { ConnectionArgs } from '../../common/pagination/connection.type';
import { UserRateLimit } from '../../common/rate-limit/user-rate-limit.guard';
import { PostConnection } from '../posts/dto/post.dto';
import { PublicUserConnection } from '../users/dto/public-user.model';
import { RecentSearchModel } from './dto/recent-search.dto';
import { SearchService } from './search.service';

/** El mismo contador para las dos búsquedas: 30 por minuto por usuario. */
const SEARCH_LIMIT = {
  name: 'search',
  limit: { env: 'RATE_LIMIT_SEARCH_PER_MINUTE' as const },
  windowSeconds: 60,
};

@Resolver()
export class SearchResolver {
  constructor(private readonly search: SearchService) {}

  @UserRateLimit(SEARCH_LIMIT)
  @Query(() => PublicUserConnection, {
    description: 'Busca personas por nombre o @handle (de 2 a 80 caracteres). Solo datos públicos.',
  })
  searchUsers(
    @CurrentUser() viewer: AuthUser,
    @Args('query', { type: () => String }) query: string,
    @Args() { first, after }: ConnectionArgs,
  ): Promise<PublicUserConnection> {
    return this.search.searchUsers(viewer.userId, query, { first, after });
  }

  @UserRateLimit(SEARCH_LIMIT)
  @Query(() => PostConnection, {
    description:
      'Busca en el título y la descripción de publicaciones públicas y activas (de 2 a 80 caracteres).',
  })
  searchPosts(
    @CurrentUser() viewer: AuthUser,
    @Args('query', { type: () => String }) query: string,
    @Args() { first, after }: ConnectionArgs,
  ): Promise<PostConnection> {
    return this.search.searchPosts(viewer.userId, query, { first, after });
  }

  @Query(() => [RecentSearchModel], { description: 'Mis búsquedas recientes (las últimas 10).' })
  recentSearches(
    @CurrentUser() viewer: AuthUser,
    @Args('first', { type: () => Int, nullable: true, defaultValue: 10 }) first: number,
  ): Promise<RecentSearchModel[]> {
    return this.search.recent(viewer.userId, first);
  }

  @Mutation(() => Boolean, { description: 'Borra mi historial de búsquedas.' })
  clearSearchHistory(@CurrentUser() viewer: AuthUser): Promise<boolean> {
    return this.search.clear(viewer.userId);
  }
}

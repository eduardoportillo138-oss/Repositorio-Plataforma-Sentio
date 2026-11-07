import { Args, Query, Resolver } from '@nestjs/graphql';
import { searchQuerySchema } from '@sentio/core';
import { ConnectionArgs } from '../../common/pagination/connection.type';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PublicUserConnection } from '../users/dto/public-user.model';
import { UsersService } from '../users/users.service';

@Resolver()
export class SearchResolver {
  constructor(private readonly users: UsersService) {}

  @Query(() => PublicUserConnection, {
    description: 'Busca personas por nombre o @handle (de 2 a 80 caracteres). Solo datos públicos.',
  })
  searchUsers(
    @Args('query', { type: () => String }, new ZodValidationPipe(searchQuerySchema)) query: string,
    @Args() { first, after }: ConnectionArgs,
  ): Promise<PublicUserConnection> {
    return this.users.searchPublic(query, { first, after });
  }
}

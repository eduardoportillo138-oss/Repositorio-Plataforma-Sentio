import { Field, ID, ObjectType } from '@nestjs/graphql';
import { type SearchHistory } from '../schemas/search-history.schema';

@ObjectType('RecentSearch')
export class RecentSearchModel {
  @Field(() => ID)
  id!: string;

  @Field()
  query!: string;

  @Field({ description: 'Última vez que se buscó.' })
  searchedAt!: Date;
}

export function toRecentSearch(doc: SearchHistory): RecentSearchModel {
  return { id: doc._id.toHexString(), query: doc.query, searchedAt: doc.lastSearchedAt };
}

import { ArgsType, Field } from '@nestjs/graphql';

// Etapa 0: tipos base. Se amplían en la Etapa 1.
@ArgsType()
export class SearchArgs {
  @Field()
  query!: string;
}

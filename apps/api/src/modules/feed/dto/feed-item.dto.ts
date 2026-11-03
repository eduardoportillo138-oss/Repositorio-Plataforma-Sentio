import { Field, ID, ObjectType } from '@nestjs/graphql';

// Etapa 0: tipos base. Se amplían en la Etapa 1.
@ObjectType('FeedItem')
export class FeedItemModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  postId!: string;

  @Field()
  createdAt!: Date;
}

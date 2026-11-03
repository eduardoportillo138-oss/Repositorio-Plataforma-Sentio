import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';

// Etapa 0: tipos base. Se amplían en la Etapa 1.
@ObjectType('Post')
export class PostModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  authorId!: string;

  @Field(() => ID, { nullable: true })
  groupId!: string | null;

  @Field()
  text!: string;

  @Field(() => Int)
  reactionCount!: number;

  @Field(() => Int)
  commentCount!: number;

  @Field()
  createdAt!: Date;
}

@InputType()
export class CreatePostInput {
  @Field()
  text!: string;

  @Field(() => ID, { nullable: true })
  groupId?: string | null;

  @Field(() => [ID], { nullable: true })
  mediaIds?: string[];
}

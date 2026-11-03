import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';

// Etapa 0: tipos base. Se amplían en la Etapa 1.
@ObjectType('Comment')
export class CommentModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  postId!: string;

  @Field(() => ID)
  authorId!: string;

  @Field()
  text!: string;

  @Field()
  createdAt!: Date;
}

@InputType()
export class CreateCommentInput {
  @Field(() => ID)
  postId!: string;

  @Field(() => ID, { nullable: true })
  parentId?: string | null;

  @Field()
  text!: string;
}

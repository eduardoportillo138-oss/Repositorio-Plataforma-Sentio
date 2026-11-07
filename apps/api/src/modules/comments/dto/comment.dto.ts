import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../../common/pagination/connection.type';
import { type Comment, type CommentAuthor } from '../schemas/comment.schema';

@ObjectType('Comment')
export class CommentModel {
  @Field(() => ID)
  id!: string;

  @Field()
  text!: string;

  @Field()
  createdAt!: Date;

  /** Internos para los field resolvers. */
  readonly postId!: string;
  readonly authorId!: string;
  readonly authorSnapshot!: CommentAuthor;
}

@ObjectType()
export class CommentConnection extends Paginated(CommentModel, 'Comment') {}

export function toCommentModel(doc: Comment): CommentModel {
  return {
    id: doc._id.toHexString(),
    text: doc.text,
    createdAt: doc.createdAt,
    postId: doc.postId.toHexString(),
    authorId: doc.authorId.toHexString(),
    authorSnapshot: doc.author,
  };
}

import { Field, ID, InputType, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { type PostVisibility as CorePostVisibility } from '@sentio/core';
import { Paginated } from '../../../common/pagination/connection.type';
import { type Post, type PostAuthor } from '../schemas/post.schema';

export const PostVisibilityEnum = { public: 'public', followers: 'followers' } as const;
registerEnumType(PostVisibilityEnum, {
  name: 'PostVisibility',
  valuesMap: {
    public: { description: 'Cualquier persona con sesión iniciada.' },
    followers: { description: 'Solo sus seguidores (y el autor).' },
  },
});

@ObjectType('PostCounts')
export class PostCountsModel {
  @Field(() => Int)
  reactions!: number;

  @Field(() => Int)
  comments!: number;

  @Field(() => Int)
  shares!: number;
}

@ObjectType('Post')
export class PostModel {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field()
  text!: string;

  @Field(() => PostVisibilityEnum)
  visibility!: CorePostVisibility;

  @Field(() => PostCountsModel)
  counts!: PostCountsModel;

  @Field()
  createdAt!: Date;

  /** Internos: los usan los field resolvers `author` y `viewerIsAuthor`. */
  readonly authorId!: string;
  readonly authorSnapshot!: PostAuthor;
}

@ObjectType()
export class PostConnection extends Paginated(PostModel, 'Post') {}

/** Validación en `createPostSchema` de @sentio/core. */
@InputType()
export class CreatePostInput {
  @Field({ description: 'De 1 a 120 caracteres.' })
  title!: string;

  @Field({ nullable: true, description: 'Hasta 5000 caracteres.' })
  text?: string;

  @Field(() => PostVisibilityEnum, { nullable: true, defaultValue: 'public' })
  visibility?: CorePostVisibility;
}

export function toPostModel(doc: Post): PostModel {
  return {
    id: doc._id.toHexString(),
    title: doc.title,
    text: doc.text,
    // Los posts de grupo no salen por estos listados; se exponen como públicos por seguridad de tipos.
    visibility: doc.visibility === 'followers' ? 'followers' : 'public',
    counts: {
      reactions: doc.counts?.reactions ?? 0,
      comments: doc.counts?.comments ?? 0,
      shares: doc.counts?.shares ?? 0,
    },
    createdAt: doc.createdAt,
    authorId: doc.authorId.toHexString(),
    authorSnapshot: doc.author,
  };
}

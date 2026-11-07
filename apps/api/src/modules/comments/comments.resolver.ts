import {
  Args,
  Context,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { objectIdSchema } from '@sentio/core';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { type AuthUser, type GqlContext } from '../../common/graphql/context';
import { ConnectionArgs } from '../../common/pagination/connection.type';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PostModel, toPostModel } from '../posts/dto/post.dto';
import { isVisibleTo } from '../posts/posts.service';
import { PublicUserModel, toPublicUser } from '../users/dto/public-user.model';
import { CommentsService } from './comments.service';
import { CommentConnection, CommentModel, toCommentModel } from './dto/comment.dto';

@Resolver(() => CommentModel)
export class CommentsResolver {
  constructor(private readonly comments: CommentsService) {}

  @Mutation(() => CommentModel, {
    description: 'Comenta una publicación (de 1 a 1000 caracteres).',
  })
  async addComment(
    @CurrentUser() viewer: AuthUser,
    @Args('postId', { type: () => ID }) postId: string,
    @Args('text') text: string,
  ): Promise<CommentModel> {
    return toCommentModel(await this.comments.add(viewer.userId, { postId, text }));
  }

  @Mutation(() => PostModel, {
    nullable: true,
    description:
      'Borra un comentario (su autor o el autor del post). Devuelve el post actualizado.',
  })
  async deleteComment(
    @CurrentUser() viewer: AuthUser,
    @Args('commentId', { type: () => ID }, new ZodValidationPipe(objectIdSchema))
    commentId: string,
  ): Promise<PostModel | null> {
    const post = await this.comments.remove(viewer.userId, commentId);
    return post ? toPostModel(post) : null;
  }

  @Query(() => CommentConnection, {
    description: 'Comentarios de primer nivel, del más antiguo al más reciente.',
  })
  postComments(
    @CurrentUser() viewer: AuthUser,
    @Args('postId', { type: () => ID }, new ZodValidationPipe(objectIdSchema)) postId: string,
    @Args() { first, after }: ConnectionArgs,
  ): Promise<CommentConnection> {
    return this.comments.list(postId, viewer.userId, { first, after });
  }

  @ResolveField(() => PublicUserModel, { description: 'Datos públicos del autor.' })
  async author(@Parent() c: CommentModel, @Context() ctx: GqlContext): Promise<PublicUserModel> {
    const user = await ctx.loaders.userById.load(c.authorId);
    if (user && user.status === 'active') return toPublicUser(user);
    return {
      id: c.authorId,
      handle: c.authorSnapshot.handle,
      displayName: c.authorSnapshot.displayName,
      avatar: null,
      bio: null,
      tags: [],
    };
  }

  @ResolveField(() => Boolean, {
    description: 'true si el usuario actual puede borrarlo (autor del comentario o del post).',
  })
  async viewerCanDelete(
    @Parent() c: CommentModel,
    @CurrentUser() viewer: AuthUser,
    @Context() ctx: GqlContext,
  ): Promise<boolean> {
    if (c.authorId === viewer.userId) return true;
    const post = await ctx.loaders.postById.load(c.postId);
    return post?.authorId.toHexString() === viewer.userId;
  }

  @ResolveField(() => PostModel, {
    nullable: true,
    description: 'Post comentado (para actualizar contadores en la caché del cliente).',
  })
  async post(
    @Parent() c: CommentModel,
    @CurrentUser() viewer: AuthUser,
    @Context() ctx: GqlContext,
  ): Promise<PostModel | null> {
    const post = await ctx.loaders.postById.load(c.postId);
    return post && isVisibleTo(post, viewer.userId) ? toPostModel(post) : null;
  }
}

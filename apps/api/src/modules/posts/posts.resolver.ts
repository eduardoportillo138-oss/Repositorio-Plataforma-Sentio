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
import { type CreatePostData, createPostSchema, handleSchema, objectIdSchema } from '@sentio/core';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { type AuthUser, type GqlContext } from '../../common/graphql/context';
import { ConnectionArgs } from '../../common/pagination/connection.type';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { UserRateLimit } from '../../common/rate-limit/user-rate-limit.guard';
import { PublicUserModel, toPublicUser } from '../users/dto/public-user.model';
import { CreatePostInput, PostConnection, PostModel } from './dto/post.dto';
import { PostsService } from './posts.service';

@Resolver(() => PostModel)
export class PostsResolver {
  constructor(private readonly posts: PostsService) {}

  @UserRateLimit({
    name: 'createPost',
    limit: { env: 'RATE_LIMIT_POSTS_PER_HOUR' },
    windowSeconds: 3600,
  })
  @Mutation(() => PostModel, { description: 'Crea una publicación (máximo 10 por hora).' })
  createPost(
    @CurrentUser() viewer: AuthUser,
    @Args('input', { type: () => CreatePostInput }, new ZodValidationPipe(createPostSchema))
    input: CreatePostData,
  ): Promise<PostModel> {
    return this.posts.create(viewer.userId, input);
  }

  @Mutation(() => ID, { description: 'Borra (lógicamente) una publicación propia.' })
  deletePost(
    @CurrentUser() viewer: AuthUser,
    @Args('postId', { type: () => ID }, new ZodValidationPipe(objectIdSchema)) postId: string,
  ): Promise<string> {
    return this.posts.remove(viewer.userId, postId);
  }

  @Query(() => PostConnection, {
    description: 'Inicio: publicaciones públicas, de la más reciente a la más antigua.',
  })
  homeFeed(@Args() { first, after }: ConnectionArgs): Promise<PostConnection> {
    return this.posts.homeFeed({ first, after });
  }

  @Query(() => PostConnection, { description: 'Publicaciones de un perfil.' })
  userPosts(
    @CurrentUser() viewer: AuthUser,
    @Args('handle', { type: () => String }, new ZodValidationPipe(handleSchema)) handle: string,
    @Args() { first, after }: ConnectionArgs,
  ): Promise<PostConnection> {
    return this.posts.userPosts(handle, viewer.userId, { first, after });
  }

  @ResolveField(() => PublicUserModel, {
    description: 'Datos públicos actuales del autor (nunca datos privados).',
  })
  async author(@Parent() post: PostModel, @Context() ctx: GqlContext): Promise<PublicUserModel> {
    const user = await ctx.loaders.userById.load(post.authorId);
    if (user && user.status === 'active') return toPublicUser(user);
    // Respaldo: la copia guardada en el post (p. ej. si la cuenta ya no existe).
    return {
      id: post.authorId,
      handle: post.authorSnapshot.handle,
      displayName: post.authorSnapshot.displayName,
      avatar: null,
      bio: null,
      tags: [],
    };
  }

  @ResolveField(() => Boolean, { description: 'true si el usuario actual es el autor.' })
  viewerIsAuthor(@Parent() post: PostModel, @CurrentUser() viewer: AuthUser): boolean {
    return post.authorId === viewer.userId;
  }
}

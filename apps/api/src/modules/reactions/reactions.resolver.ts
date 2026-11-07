import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { objectIdSchema } from '@sentio/core';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { type AuthUser } from '../../common/graphql/context';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PostModel, toPostModel } from '../posts/dto/post.dto';
import { ReactionsService } from './reactions.service';

@Resolver()
export class ReactionsResolver {
  constructor(private readonly reactions: ReactionsService) {}

  @Mutation(() => PostModel, {
    description: 'Da o quita "Me gusta". Devuelve el post con contador y viewerHasLiked al día.',
  })
  async toggleLike(
    @CurrentUser() viewer: AuthUser,
    @Args('postId', { type: () => ID }, new ZodValidationPipe(objectIdSchema)) postId: string,
  ): Promise<PostModel> {
    const { post } = await this.reactions.toggleLike(viewer.userId, postId);
    return toPostModel(post);
  }
}

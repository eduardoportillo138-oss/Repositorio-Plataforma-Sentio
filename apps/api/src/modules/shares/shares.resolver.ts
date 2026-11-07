import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { type AuthUser } from '../../common/graphql/context';
import { UserRateLimit } from '../../common/rate-limit/user-rate-limit.guard';
import { toPostModel } from '../posts/dto/post.dto';
import { SharePostResultModel } from './dto/share.dto';
import { SharesService } from './shares.service';

@Resolver()
export class SharesResolver {
  constructor(private readonly shares: SharesService) {}

  @UserRateLimit({
    name: 'sharePost',
    limit: { env: 'RATE_LIMIT_SHARES_PER_HOUR' },
    windowSeconds: 3600,
  })
  @Mutation(() => SharePostResultModel, {
    description:
      'Comparte una publicación pública con hasta 10 personas (crea una notificación para cada una).',
  })
  async sharePost(
    @CurrentUser() viewer: AuthUser,
    @Args('postId', { type: () => ID }) postId: string,
    @Args('recipientIds', { type: () => [ID] }) recipientIds: string[],
    @Args('message', { type: () => String, nullable: true }) message?: string | null,
  ): Promise<SharePostResultModel> {
    const { post, sentTo } = await this.shares.share(viewer.userId, {
      postId,
      recipientIds,
      message,
    });
    return { post: toPostModel(post), sentTo };
  }
}

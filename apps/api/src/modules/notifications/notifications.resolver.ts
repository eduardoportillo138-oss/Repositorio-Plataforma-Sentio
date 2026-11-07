import {
  Args,
  Context,
  ID,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { type AuthUser, type GqlContext } from '../../common/graphql/context';
import { ConnectionArgs } from '../../common/pagination/connection.type';
import { PostModel, toPostModel } from '../posts/dto/post.dto';
import { isVisibleTo } from '../posts/posts.service';
import { PublicUserModel, toPublicUser } from '../users/dto/public-user.model';
import { NotificationConnection, NotificationModel } from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

@Resolver(() => NotificationModel)
export class NotificationsResolver {
  constructor(private readonly notifications: NotificationsService) {}

  @Query(() => NotificationConnection, {
    name: 'notifications',
    description: 'Mis notificaciones, de la más reciente a la más antigua.',
  })
  listNotifications(
    @CurrentUser() viewer: AuthUser,
    @Args() { first, after }: ConnectionArgs,
  ): Promise<NotificationConnection> {
    return this.notifications.list(viewer.userId, { first, after });
  }

  @Query(() => Int, { description: 'Cuántas notificaciones sin leer tengo.' })
  unreadNotificationsCount(@CurrentUser() viewer: AuthUser): Promise<number> {
    return this.notifications.unreadCount(viewer.userId);
  }

  @Mutation(() => Int, {
    description: 'Marca como leídas las indicadas, o todas si no se indican. Devuelve cuántas.',
  })
  markNotificationsRead(
    @CurrentUser() viewer: AuthUser,
    @Args('ids', { type: () => [ID], nullable: true }) ids?: string[] | null,
  ): Promise<number> {
    return this.notifications.markRead(viewer.userId, ids);
  }

  @ResolveField(() => PublicUserModel, { nullable: true, description: 'Quién la originó.' })
  async actor(
    @Parent() n: NotificationModel,
    @Context() ctx: GqlContext,
  ): Promise<PublicUserModel | null> {
    if (!n.actorId) return null;
    const user = await ctx.loaders.userById.load(n.actorId);
    return user && user.status === 'active' ? toPublicUser(user) : null;
  }

  @ResolveField(() => PostModel, {
    nullable: true,
    description: 'Publicación relacionada, si existe y el usuario la puede ver.',
  })
  async post(
    @Parent() n: NotificationModel,
    @CurrentUser() viewer: AuthUser,
    @Context() ctx: GqlContext,
  ): Promise<PostModel | null> {
    if (n.entity?.kind !== 'post') return null;
    const post = await ctx.loaders.postById.load(n.entity.id);
    return post && isVisibleTo(post, viewer.userId) ? toPostModel(post) : null;
  }
}

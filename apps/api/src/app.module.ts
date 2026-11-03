import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConditionalModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AUTH_RATE_LIMIT_KEY } from './common/decorators/auth-rate-limit.decorator';
import { DataloaderModule } from './common/dataloaders/dataloader.module';
import { DataloaderService } from './common/dataloaders/dataloader.service';
import { AllExceptionsFilter } from './common/filters/gql-exception.filter';
import { buildGraphqlOptions } from './common/graphql/graphql.options';
import { GqlAuthGuard } from './common/guards/gql-auth.guard';
import { GqlThrottlerGuard } from './common/guards/gql-throttler.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AppConfigService } from './config/app-config.service';
import { AppConfigModule } from './config/config.module';
import { GatewaysModule } from './gateways/gateways.module';
import { HealthController } from './health/health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { CommentsModule } from './modules/comments/comments.module';
import { FeedModule } from './modules/feed/feed.module';
import { GroupsModule } from './modules/groups/groups.module';
import { MediaModule } from './modules/media/media.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PostsModule } from './modules/posts/posts.module';
import { ReactionsModule } from './modules/reactions/reactions.module';
import { SearchModule } from './modules/search/search.module';
import { UsersModule } from './modules/users/users.module';
import { WorkersModule } from './workers/workers.module';

@Module({
  imports: [
    AppConfigModule,
    MongooseModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        uri: config.get('MONGODB_URI'),
        // En desarrollo Mongoose crea los índices; en producción se gestionan con migraciones.
        autoIndex: !config.isProduction,
      }),
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [DataloaderModule],
      inject: [AppConfigService, DataloaderService],
      useFactory: buildGraphqlOptions,
    }),
    ThrottlerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        const ttl = config.get('RATE_LIMIT_TTL_SECONDS') * 1000;
        return {
          // TODO(Etapa 1): almacenamiento en Redis para compartir contadores entre instancias.
          throttlers: [
            { name: 'default', ttl, limit: config.get('RATE_LIMIT_DEFAULT_MAX') },
            {
              name: 'auth',
              ttl,
              limit: config.get('RATE_LIMIT_AUTH_MAX'),
              skipIf: (ctx) => Reflect.getMetadata(AUTH_RATE_LIMIT_KEY, ctx.getHandler()) !== true,
            },
          ],
        };
      },
    }),
    ConditionalModule.registerWhen(WorkersModule, (env) => env.QUEUES_ENABLED !== 'false'),
    AuthModule,
    UsersModule,
    PostsModule,
    FeedModule,
    GroupsModule,
    CommentsModule,
    ReactionsModule,
    ChatModule,
    NotificationsModule,
    MediaModule,
    SearchModule,
    ModerationModule,
    GatewaysModule,
  ],
  controllers: [HealthController],
  providers: [
    // El orden importa: primero el rate limit y después la autenticación.
    { provide: APP_GUARD, useClass: GqlThrottlerGuard },
    { provide: APP_GUARD, useClass: GqlAuthGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}

import { Global, Module } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import {
  MemoryRateLimitStore,
  RATE_LIMIT_STORE,
  type RateLimitStore,
  RedisRateLimitStore,
} from './rate-limit.store';
import { UserRateLimitGuard } from './user-rate-limit.guard';

/** Límites de tasa por usuario. Redis solo si las colas están activas (mismo indicador). */
@Global()
@Module({
  providers: [
    {
      provide: RATE_LIMIT_STORE,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): RateLimitStore =>
        config.get('QUEUES_ENABLED')
          ? RedisRateLimitStore.fromUrl(config.get('REDIS_URL'))
          : new MemoryRateLimitStore(),
    },
    UserRateLimitGuard,
  ],
  exports: [RATE_LIMIT_STORE, UserRateLimitGuard],
})
export class RateLimitModule {}

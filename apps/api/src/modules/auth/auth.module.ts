import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AppConfigService } from '../../config/app-config.service';
import { UsersModule } from '../users/users.module';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { Session, SessionSchema } from './schemas/session.schema';
import {
  MemorySessionActivityCache,
  RedisSessionActivityCache,
  SESSION_ACTIVITY_CACHE,
  type SessionActivityCache,
} from './session-activity.cache';
import { SessionEvents } from './session-events';
import { SessionsService } from './sessions.service';
import { TokensService } from './tokens.service';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
    JwtModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.get('JWT_ACCESS_SECRET'),
        signOptions: {
          algorithm: 'HS256',
          expiresIn: config.get('JWT_ACCESS_TTL_SECONDS'),
          issuer: config.get('JWT_ISSUER'),
          audience: config.get('JWT_AUDIENCE'),
        },
        verifyOptions: {
          algorithms: ['HS256'],
          issuer: config.get('JWT_ISSUER'),
          audience: config.get('JWT_AUDIENCE'),
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    AuthResolver,
    PasswordService,
    SessionsService,
    TokensService,
    SessionEvents,
    {
      provide: SESSION_ACTIVITY_CACHE,
      inject: [AppConfigService],
      // Redis solo si las colas están activas (es el mismo indicador de "hay Redis").
      useFactory: (config: AppConfigService): SessionActivityCache =>
        config.get('QUEUES_ENABLED')
          ? RedisSessionActivityCache.fromUrl(config.get('REDIS_URL'))
          : new MemorySessionActivityCache(),
    },
  ],
  exports: [TokensService, SessionsService, SessionEvents],
})
export class AuthModule {}

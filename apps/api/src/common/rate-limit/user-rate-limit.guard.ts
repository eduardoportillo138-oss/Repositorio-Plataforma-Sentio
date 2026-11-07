import {
  applyDecorators,
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppConfigService } from '../../config/app-config.service';
import { type Env } from '../../config/env.schema';
import { Errors } from '../errors/app-error';
import { getRequest } from '../graphql/context';
import { RATE_LIMIT_STORE, type RateLimitStore } from './rate-limit.store';

export const USER_RATE_LIMIT_KEY = 'ratelimit:user';

export interface UserRateLimitOptions {
  /** Nombre del contador (p. ej. `createPost`). */
  name: string;
  /** Máximo por ventana; un número fijo o la variable de entorno que lo define. */
  limit: number | { env: keyof Env };
  windowSeconds: number;
}

/**
 * Límite por usuario autenticado (no por IP). Corre después del guard de autenticación global,
 * así que `req.user` ya existe. Uso: `@UserRateLimit({ name: 'createPost', limit: 10, windowSeconds: 3600 })`.
 */
export const UserRateLimit = (options: UserRateLimitOptions) =>
  applyDecorators(SetMetadata(USER_RATE_LIMIT_KEY, options), UseGuards(UserRateLimitGuard));

@Injectable()
export class UserRateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: AppConfigService,
    @Inject(RATE_LIMIT_STORE) private readonly store: RateLimitStore,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<UserRateLimitOptions | undefined>(
      USER_RATE_LIMIT_KEY,
      context.getHandler(),
    );
    if (!options) return true;
    const user = getRequest(context).user;
    if (!user) throw Errors.unauthenticated();

    const limit =
      typeof options.limit === 'number'
        ? options.limit
        : Number(this.config.get(options.limit.env));
    const { count, resetAt } = await this.store.hit(
      `${options.name}:${user.userId}`,
      options.windowSeconds,
    );
    if (count > limit) {
      throw Errors.rateLimited(
        `Límite de ${limit} por ${options.windowSeconds} s alcanzado. Intenta después de ${new Date(resetAt).toISOString()}.`,
      );
    }
    return true;
  }
}

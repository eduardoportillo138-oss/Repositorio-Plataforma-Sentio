import { type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorCode } from '@sentio/core';
import { type AppConfigService } from '../../config/app-config.service';
import { MemoryRateLimitStore } from './rate-limit.store';
import {
  USER_RATE_LIMIT_KEY,
  UserRateLimitGuard,
  type UserRateLimitOptions,
} from './user-rate-limit.guard';

function context(user: { userId: string } | undefined): ExecutionContext {
  const handler = () => undefined;
  return {
    getType: () => 'http',
    getHandler: () => handler,
    getClass: () => Object,
    switchToHttp: () => ({ getRequest: () => ({ user }), getResponse: () => ({}) }),
  } as unknown as ExecutionContext;
}

function setup(options: UserRateLimitOptions | undefined, env: Record<string, unknown> = {}) {
  const reflector = new Reflector();
  jest
    .spyOn(reflector, 'get')
    .mockImplementation((key) => (key === USER_RATE_LIMIT_KEY ? options : undefined));
  const config = { get: (k: string) => env[k] } as unknown as AppConfigService;
  return new UserRateLimitGuard(reflector, config, new MemoryRateLimitStore());
}

describe('UserRateLimitGuard', () => {
  it('deja pasar handlers sin límite', async () => {
    await expect(setup(undefined).canActivate(context(undefined))).resolves.toBe(true);
  });

  it('exige usuario autenticado', async () => {
    const guard = setup({ name: 'x', limit: 1, windowSeconds: 60 });
    await expect(guard.canActivate(context(undefined))).rejects.toMatchObject({
      extensions: { code: ErrorCode.UNAUTHENTICATED },
    });
  });

  it('permite hasta el límite y luego responde RATE_LIMITED, por usuario', async () => {
    const guard = setup({ name: 'createPost', limit: 2, windowSeconds: 60 });
    const ana = context({ userId: 'ana' });
    await expect(guard.canActivate(ana)).resolves.toBe(true);
    await expect(guard.canActivate(ana)).resolves.toBe(true);
    await expect(guard.canActivate(ana)).rejects.toMatchObject({
      extensions: { code: ErrorCode.RATE_LIMITED },
    });
    await expect(guard.canActivate(context({ userId: 'beto' }))).resolves.toBe(true);
  });

  it('lee el límite de una variable de entorno', async () => {
    const guard = setup(
      { name: 'search', limit: { env: 'RATE_LIMIT_POSTS_PER_HOUR' }, windowSeconds: 60 },
      { RATE_LIMIT_POSTS_PER_HOUR: 1 },
    );
    const ana = context({ userId: 'ana' });
    await expect(guard.canActivate(ana)).resolves.toBe(true);
    await expect(guard.canActivate(ana)).rejects.toMatchObject({
      extensions: { code: ErrorCode.RATE_LIMITED },
    });
  });
});

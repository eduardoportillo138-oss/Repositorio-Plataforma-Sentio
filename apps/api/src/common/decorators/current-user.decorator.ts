import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { Errors } from '../errors/app-error';
import { type AuthUser, getRequest } from '../graphql/context';

/**
 * Inyecta el usuario autenticado. En rutas `@Public()` usa `@CurrentUser({ optional: true })`.
 */
export const CurrentUser = createParamDecorator(
  (options: { optional?: boolean } | undefined, context: ExecutionContext): AuthUser | null => {
    const user = getRequest(context).user ?? null;
    if (!user && !options?.optional) throw Errors.unauthenticated();
    return user;
  },
);

import { SetMetadata } from '@nestjs/common';

export const AUTH_RATE_LIMIT_KEY = 'throttle:auth';

/** Aplica el límite estricto `auth` (RATE_LIMIT_AUTH_MAX por ventana) además del general. */
export const AuthRateLimit = () => SetMetadata(AUTH_RATE_LIMIT_KEY, true);

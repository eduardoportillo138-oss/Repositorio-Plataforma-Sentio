import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SessionsService } from '../../modules/auth/sessions.service';
import { TokensService } from '../../modules/auth/tokens.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Errors } from '../errors/app-error';
import { getRequest } from '../graphql/context';

/**
 * Guard global: exige un access token válido (Authorization: Bearer) salvo en `@Public()`.
 * Además de la firma, comprueba que la sesión del token (`sid`) siga activa: tras un logout
 * o una revocación el token deja de servir al momento, no cuando expira.
 * En rutas públicas, si llega un token válido igualmente se adjunta el usuario.
 * Los WebSockets se autentican en el handshake del gateway, no aquí.
 */
@Injectable()
export class GqlAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokensService,
    private readonly sessions: SessionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() === 'ws') return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const req = getRequest(context);
    const token = extractBearer(req.headers.authorization);

    if (!token) {
      if (isPublic) return true;
      throw Errors.unauthenticated();
    }

    const user = await this.tokens.verifyAccessToken(token);
    if (!user) {
      if (isPublic) return true;
      throw Errors.unauthenticated('El token de acceso es inválido o expiró.');
    }
    if (!(await this.sessions.isActive(user.sessionId))) {
      if (isPublic) return true;
      throw Errors.unauthenticated('La sesión se cerró. Inicia sesión de nuevo.');
    }
    req.user = user;
    return true;
  }
}

export function extractBearer(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, value] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && value ? value : null;
}

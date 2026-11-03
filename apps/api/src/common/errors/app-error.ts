import { ErrorCode } from '@sentio/core';
import { GraphQLError } from 'graphql';

/** Error de dominio con `extensions.code` estable para los clientes. */
export class AppError extends GraphQLError {
  constructor(code: ErrorCode, message: string, extensions: Record<string, unknown> = {}) {
    super(message, { extensions: { ...extensions, code } });
  }
}

export const Errors = {
  unauthenticated: (message = 'Se requiere autenticación.') =>
    new AppError(ErrorCode.UNAUTHENTICATED, message),
  forbidden: (message = 'No tienes permiso para realizar esta acción.') =>
    new AppError(ErrorCode.FORBIDDEN, message),
  forbiddenGroup: (groupId: string, message = 'No tienes permiso en este grupo.') =>
    new AppError(ErrorCode.FORBIDDEN_GROUP, message, { groupId }),
  rateLimited: (message = 'Demasiadas solicitudes. Intenta de nuevo más tarde.') =>
    new AppError(ErrorCode.RATE_LIMITED, message),
  badInput: (message: string, fieldErrors?: Record<string, string[]>) =>
    new AppError(ErrorCode.BAD_USER_INPUT, message, fieldErrors ? { fieldErrors } : {}),
  notFound: (resource: string) => new AppError(ErrorCode.NOT_FOUND, `${resource} no encontrado.`),
  conflict: (message: string, field?: string) =>
    new AppError(ErrorCode.CONFLICT, message, field ? { field } : {}),
  invalidCredentials: () =>
    new AppError(ErrorCode.INVALID_CREDENTIALS, 'Correo o contraseña incorrectos.'),
  refreshTokenInvalid: () =>
    new AppError(ErrorCode.REFRESH_TOKEN_INVALID, 'La sesión expiró. Inicia sesión de nuevo.'),
  refreshTokenReused: () =>
    new AppError(
      ErrorCode.REFRESH_TOKEN_REUSED,
      'Detectamos un uso indebido de tu sesión y la cerramos por seguridad.',
    ),
} as const;

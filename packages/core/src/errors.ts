/**
 * Códigos que la API pone en `extensions.code` de los errores GraphQL.
 * Los clientes los usan para decidir qué hacer (refrescar token, mostrar mensaje, etc.).
 */
export const ErrorCode = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  FORBIDDEN_GROUP: 'FORBIDDEN_GROUP',
  RATE_LIMITED: 'RATE_LIMITED',
  BAD_USER_INPUT: 'BAD_USER_INPUT',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  REFRESH_TOKEN_INVALID: 'REFRESH_TOKEN_INVALID',
  REFRESH_TOKEN_REUSED: 'REFRESH_TOKEN_REUSED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

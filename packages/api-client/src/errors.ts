import { ApolloError } from '@apollo/client';
import { type ErrorCode } from '@sentio/core';
import { type GraphQLFormattedError } from 'graphql';

export interface ApiErrorInfo {
  code: ErrorCode | 'NETWORK' | 'UNKNOWN';
  message: string;
  /** Campo en conflicto (CONFLICT). */
  field?: string;
  /** Errores por campo (BAD_USER_INPUT), con claves de traducción como valores. */
  fieldErrors?: Record<string, string[]>;
}

/** Normaliza un error de Apollo al código de extensión que manda la API. */
export function parseApiError(error: unknown): ApiErrorInfo {
  if (error instanceof ApolloError) {
    const gqlError: GraphQLFormattedError | undefined = error.graphQLErrors[0];
    if (gqlError) {
      const ext = gqlError.extensions ?? {};
      return {
        code: (typeof ext.code === 'string' ? ext.code : 'UNKNOWN') as ApiErrorInfo['code'],
        message: gqlError.message,
        field: typeof ext.field === 'string' ? ext.field : undefined,
        fieldErrors: isFieldErrors(ext.fieldErrors) ? ext.fieldErrors : undefined,
      };
    }
    if (error.networkError) return { code: 'NETWORK', message: error.networkError.message };
  }
  return { code: 'UNKNOWN', message: error instanceof Error ? error.message : String(error) };
}

function isFieldErrors(value: unknown): value is Record<string, string[]> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

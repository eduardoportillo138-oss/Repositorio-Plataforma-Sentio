import { type ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { type GqlContextType, type GqlExceptionFilter } from '@nestjs/graphql';
import { ThrottlerException } from '@nestjs/throttler';
import { ErrorCode } from '@sentio/core';
import { GraphQLError } from 'graphql';
import { mongo } from 'mongoose';
import { AppError, Errors } from '../errors/app-error';

const STATUS_TO_CODE: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.BAD_USER_INPUT,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHENTICATED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.CONFLICT]: ErrorCode.CONFLICT,
  [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.RATE_LIMITED,
};

/**
 * Normaliza cualquier excepción de un resolver a un GraphQLError con `extensions.code`.
 * En contextos HTTP delega en el filtro por defecto de Nest.
 */
@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter implements GqlExceptionFilter {
  private readonly logger = new Logger('GraphQL');

  override catch(exception: unknown, host: ArgumentsHost): unknown {
    if (host.getType<GqlContextType>() !== 'graphql') {
      return super.catch(exception, host);
    }
    return toGraphQLError(exception, this.logger);
  }
}

export function toGraphQLError(exception: unknown, logger?: Logger): GraphQLError {
  if (exception instanceof GraphQLError) return exception;

  if (exception instanceof ThrottlerException) return Errors.rateLimited();

  if (exception instanceof HttpException) {
    const code = STATUS_TO_CODE[exception.getStatus()];
    if (code) return new AppError(code, exception.message);
  }

  if (exception instanceof mongo.MongoServerError && exception.code === 11000) {
    const field = Object.keys(
      (exception.keyPattern as Record<string, unknown> | undefined) ?? {},
    )[0];
    return Errors.conflict('El recurso ya existe.', field);
  }

  logger?.error(exception instanceof Error ? exception.stack : String(exception));
  return new AppError(ErrorCode.INTERNAL_SERVER_ERROR, 'Error interno del servidor.');
}

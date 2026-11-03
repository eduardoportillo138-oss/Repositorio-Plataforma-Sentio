import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import { type GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { type Observable, tap } from 'rxjs';

/** Registra la duración de cada operación GraphQL de nivel superior. */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('GraphQL');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType<GqlContextType>() !== 'graphql') return next.handle();

    const info = GqlExecutionContext.create(context).getInfo<{
      parentType: { name: string };
      fieldName: string;
    }>();
    // Solo campos raíz (Query/Mutation); los field resolvers generarían demasiado ruido.
    if (!['Query', 'Mutation'].includes(info.parentType.name)) return next.handle();

    const started = Date.now();
    const label = `${info.parentType.name}.${info.fieldName}`;
    return next.handle().pipe(
      tap({
        next: () => this.logger.log(`${label} ${Date.now() - started}ms`),
        error: (err: unknown) =>
          this.logger.warn(`${label} ${Date.now() - started}ms ✗ ${(err as Error).message}`),
      }),
    );
  }
}

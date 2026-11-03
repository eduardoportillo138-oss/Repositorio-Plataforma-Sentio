import { type ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { type Request, type Response } from 'express';
import { Errors } from '../errors/app-error';
import { getRequest, getResponse } from '../graphql/context';

/** ThrottlerGuard que entiende el contexto GraphQL y responde con el código RATE_LIMITED. */
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  protected override getRequestResponse(context: ExecutionContext): {
    req: Record<string, unknown>;
    res: Record<string, unknown>;
  } {
    const req: Request = getRequest(context);
    const res: Response = getResponse(context);
    return {
      req: req as unknown as Record<string, unknown>,
      res: res as unknown as Record<string, unknown>,
    };
  }

  protected override getTracker(req: Record<string, unknown>): Promise<string> {
    return Promise.resolve((req as unknown as Request).ip ?? 'unknown');
  }

  protected override throwThrottlingException(): Promise<void> {
    throw Errors.rateLimited();
  }

  override canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() === 'ws') return Promise.resolve(true);
    return super.canActivate(context);
  }
}

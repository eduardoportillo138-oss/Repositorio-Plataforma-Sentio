import { type ExecutionContext } from '@nestjs/common';
import { type GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { type Request, type Response } from 'express';
import { type Loaders } from '../dataloaders/dataloader.service';

/** Usuario autenticado que el guard adjunta a la request. */
export interface AuthUser {
  userId: string;
  sessionId: string;
}

export type AppRequest = Request & { user?: AuthUser };

export interface GqlContext {
  req: AppRequest;
  res: Response;
  loaders: Loaders;
}

/** Obtiene la request HTTP tanto en contextos GraphQL como REST. */
export function getRequest(context: ExecutionContext): AppRequest {
  if (context.getType<GqlContextType>() === 'graphql') {
    return GqlExecutionContext.create(context).getContext<GqlContext>().req;
  }
  return context.switchToHttp().getRequest<AppRequest>();
}

export function getResponse(context: ExecutionContext): Response {
  if (context.getType<GqlContextType>() === 'graphql') {
    return GqlExecutionContext.create(context).getContext<GqlContext>().res;
  }
  return context.switchToHttp().getResponse<Response>();
}

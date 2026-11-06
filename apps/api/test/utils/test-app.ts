import { type INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { type Connection, ConnectionStates } from 'mongoose';
import request from 'supertest';
import { type App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap';

export interface GqlError {
  message: string;
  extensions?: { code?: string; [k: string]: unknown };
}

export interface GqlResult<T> {
  status: number;
  data: T | null;
  errors?: GqlError[];
  headers: Record<string, string | string[] | undefined>;
}

export interface GqlOptions {
  token?: string;
  headers?: Record<string, string>;
  cookie?: string;
}

export interface TestApp {
  app: INestApplication;
  gql: <T = Record<string, unknown>>(
    query: string,
    variables?: Record<string, unknown>,
    options?: GqlOptions,
  ) => Promise<GqlResult<T>>;
  close: () => Promise<void>;
}

/**
 * Levanta la API completa contra el MongoDB en memoria de global-setup.ts.
 * Las colas están desactivadas (QUEUES_ENABLED=false), así que no se necesita Redis.
 */
export async function createTestApp(): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = configureApp(moduleRef.createNestApplication({ logger: ['error'] }));
  await app.init();
  const server = app.getHttpServer() as App;

  const gql: TestApp['gql'] = async <T>(
    query: string,
    variables?: Record<string, unknown>,
    options: GqlOptions = {},
  ) => {
    let req = request(server)
      .post('/graphql')
      .set('Content-Type', 'application/json')
      .send({ query, variables });
    if (options.token) req = req.set('Authorization', `Bearer ${options.token}`);
    if (options.cookie) req = req.set('Cookie', options.cookie);
    for (const [k, v] of Object.entries(options.headers ?? {})) req = req.set(k, v);
    const res = await req;
    const body = res.body as { data?: T | null; errors?: GqlError[] };
    return {
      status: res.status,
      data: body.data ?? null,
      errors: body.errors,
      headers: res.headers,
    };
  };

  const connection = app.get<Connection>(getConnectionToken());

  /**
   * Cierra la app (servidor HTTP, Socket.IO, cache de sesiones) y garantiza que la conexión de
   * Mongoose quede cerrada: sin esto Jest no termina por sí solo y haría falta --forceExit.
   * El MongoDB en memoria lo detiene global-teardown.ts.
   */
  const close = async (): Promise<void> => {
    await app.close();
    if (connection.readyState !== ConnectionStates.disconnected) await connection.close();
  };

  return { app, gql, close };
}

import { join } from 'node:path';
import { type ApolloDriverConfig } from '@nestjs/apollo';
import { ErrorCode } from '@sentio/core';
import { type GraphQLFormattedError } from 'graphql';
import depthLimit from 'graphql-depth-limit';
import { type AppConfigService } from '../../config/app-config.service';
import { type DataloaderService } from '../dataloaders/dataloader.service';
import { type GqlContext } from './context';

/** Ruta del schema SDL que consume packages/graphql para el codegen. */
export const SCHEMA_FILE = join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
  'packages',
  'graphql',
  'schema.graphql',
);

export function buildGraphqlOptions(
  config: AppConfigService,
  dataloaders: DataloaderService,
): ApolloDriverConfig {
  const isProd = config.isProduction;

  return {
    // Schema en memoria: el archivo SCHEMA_FILE lo escribe solo `pnpm schema:emit`,
    // así el repositorio no cambia cada vez que arranca la API.
    autoSchemaFile: true,
    sortSchema: true,
    path: '/graphql',
    playground: config.get('GRAPHQL_PLAYGROUND') && !isProd,
    introspection: !isProd,
    includeStacktraceInErrorResponses: !isProd,
    validationRules: [depthLimit(config.get('GRAPHQL_DEPTH_LIMIT'))],
    context: ({ req, res }: Pick<GqlContext, 'req' | 'res'>): GqlContext => ({
      req,
      res,
      loaders: dataloaders.createLoaders(),
    }),
    formatError: (formatted: GraphQLFormattedError): GraphQLFormattedError => {
      const code = formatted.extensions?.code;
      // Errores de validación del propio GraphQL (incluido el límite de profundidad).
      if (code === 'GRAPHQL_VALIDATION_FAILED' || code === 'BAD_USER_INPUT') {
        return {
          ...formatted,
          extensions: { ...formatted.extensions, code: ErrorCode.BAD_USER_INPUT },
        };
      }
      if (isProd && (code === ErrorCode.INTERNAL_SERVER_ERROR || code === undefined)) {
        return {
          message: 'Error interno del servidor.',
          path: formatted.path,
          extensions: { code: ErrorCode.INTERNAL_SERVER_ERROR },
        };
      }
      return formatted;
    },
  };
}

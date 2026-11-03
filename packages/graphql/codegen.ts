import { type CodegenConfig } from '@graphql-codegen/cli';

/**
 * Flujo:
 *   1. apps/api genera schema.graphql (pnpm schema:emit, o al arrancar la API en desarrollo).
 *   2. Este codegen lee el schema + operations/**\/*.graphql y genera tipos y hooks de Apollo
 *      en packages/api-client/src/generated, que consumen web y móvil.
 */
const config: CodegenConfig = {
  schema: './schema.graphql',
  documents: ['./operations/**/*.graphql'],
  ignoreNoDocuments: false,
  generates: {
    '../api-client/src/generated/graphql.ts': {
      plugins: [
        {
          add: {
            content: '/* eslint-disable */\n// Archivo generado por @sentio/graphql. No editar.',
          },
        },
        'typescript',
        'typescript-operations',
        'typescript-react-apollo',
      ],
      config: {
        useTypeImports: true,
        enumsAsTypes: true,
        avoidOptionals: { field: true, inputValue: false, object: false },
        maybeValue: 'T | null',
        scalars: { DateTime: 'string', ID: 'string' },
        withHooks: true,
        withRefetchFn: false,
        dedupeFragments: true,
      },
    },
  },
};

export default config;

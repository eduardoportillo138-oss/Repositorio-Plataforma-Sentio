import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { boundaries } from './boundaries.mjs';

/**
 * Config base type-aware. Cada workspace la extiende pasando su directorio raíz.
 * @param {{ tsconfigRootDir: string, workspace?: 'app' | 'package' | 'platform-agnostic' }} options
 */
export function base({ tsconfigRootDir, workspace = 'package' }) {
  return tseslint.config(
    {
      ignores: [
        '**/dist/**',
        '**/.next/**',
        '**/.expo/**',
        '**/coverage/**',
        '**/generated/**',
        '**/*.config.{js,mjs,cjs,ts}',
        '**/eslint.config.mjs',
        '**/scripts/**/*.mjs',
        '**/babel.config.js',
        '**/metro.config.js',
        '**/next-env.d.ts',
      ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        globals: { ...globals.es2024 },
        parserOptions: { projectService: true, tsconfigRootDir },
      },
      rules: {
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
        ],
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
        '@typescript-eslint/no-floating-promises': 'error',
        'no-console': ['warn', { allow: ['warn', 'error'] }],
      },
    },
    ...boundaries(workspace),
    prettier,
  );
}

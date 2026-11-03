import globals from 'globals';
import { base } from './base.mjs';

/** @param {{ tsconfigRootDir: string }} options */
export function nest({ tsconfigRootDir }) {
  return [
    ...base({ tsconfigRootDir, workspace: 'app' }),
    {
      languageOptions: { globals: { ...globals.node, ...globals.jest } },
      rules: {
        // Nest inyecta por metadatos de constructor: las clases deben importarse como valores.
        '@typescript-eslint/consistent-type-imports': 'off',
        '@typescript-eslint/no-extraneous-class': 'off',
      },
    },
  ];
}

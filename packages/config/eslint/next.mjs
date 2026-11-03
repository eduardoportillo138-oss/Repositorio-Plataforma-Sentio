import nextPlugin from '@next/eslint-plugin-next';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import { base } from './base.mjs';

/** @param {{ tsconfigRootDir: string }} options */
export function next({ tsconfigRootDir }) {
  return [
    ...base({ tsconfigRootDir, workspace: 'app' }),
    {
      plugins: { '@next/next': nextPlugin, 'react-hooks': reactHooks },
      languageOptions: { globals: { ...globals.browser, ...globals.node } },
      rules: {
        ...nextPlugin.configs.recommended.rules,
        ...nextPlugin.configs['core-web-vitals'].rules,
        ...reactHooks.configs.recommended.rules,
      },
    },
  ];
}

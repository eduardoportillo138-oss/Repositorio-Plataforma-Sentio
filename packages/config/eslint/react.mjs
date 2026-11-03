import reactHooks from 'eslint-plugin-react-hooks';
import { base } from './base.mjs';

/**
 * Config para librerías React (ui, api-client, i18n, realtime).
 * @param {{ tsconfigRootDir: string, workspace?: 'package' | 'platform-agnostic' }} options
 */
export function react({ tsconfigRootDir, workspace = 'package' }) {
  return [
    ...base({ tsconfigRootDir, workspace }),
    {
      plugins: { 'react-hooks': reactHooks },
      rules: { ...reactHooks.configs.recommended.rules },
    },
  ];
}

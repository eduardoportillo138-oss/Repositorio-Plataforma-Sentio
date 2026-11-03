import reactHooks from 'eslint-plugin-react-hooks';
import { base } from './base.mjs';

/** @param {{ tsconfigRootDir: string }} options */
export function reactNative({ tsconfigRootDir }) {
  return [
    ...base({ tsconfigRootDir, workspace: 'app' }),
    {
      plugins: { 'react-hooks': reactHooks },
      rules: { ...reactHooks.configs.recommended.rules },
    },
  ];
}

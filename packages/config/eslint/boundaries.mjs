/**
 * Reglas de dependencia del monorepo:
 *  - packages/* nunca importa apps/*.
 *  - packages/ui y packages/core no usan APIs del DOM ni nativas.
 * @param {'app' | 'package' | 'platform-agnostic'} workspace
 */
export function boundaries(workspace) {
  if (workspace === 'app') return [];

  const appImports = {
    group: [
      '@sentio/api',
      '@sentio/api/*',
      '@sentio/web',
      '@sentio/web/*',
      '@sentio/mobile',
      '@sentio/mobile/*',
      '**/apps/**',
    ],
    message: 'packages/* no puede importar desde apps/*.',
  };

  if (workspace === 'package') {
    return [{ rules: { 'no-restricted-imports': ['error', { patterns: [appImports] }] } }];
  }

  return [
    {
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              appImports,
              {
                group: [
                  'react-dom',
                  'react-dom/*',
                  'react-native',
                  'react-native/*',
                  'expo',
                  'expo-*',
                  'next',
                  'next/*',
                ],
                message:
                  'packages/ui y packages/core deben ser agnósticos de plataforma (sin DOM ni APIs nativas).',
              },
            ],
          },
        ],
        'no-restricted-globals': [
          'error',
          ...['window', 'document', 'navigator', 'localStorage', 'sessionStorage', 'location'].map(
            (name) => ({
              name,
              message: `"${name}" es una API de plataforma; no se permite en paquetes agnósticos.`,
            }),
          ),
        ],
      },
    },
  ];
}

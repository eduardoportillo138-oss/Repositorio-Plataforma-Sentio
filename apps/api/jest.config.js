const transform = {
  '^.+\\.ts$': [
    'ts-jest',
    // 151002: aviso de ts-jest por module Node16; el typecheck completo corre aparte con tsc.
    { tsconfig: '<rootDir>/tsconfig.json', diagnostics: { ignoreCodes: [151002] } },
  ],
};

/** @type {import('jest').Config} */
module.exports = {
  // Arrancar la app y MongoDB en memoria tarda varios segundos en Windows.
  testTimeout: 120000,
  // `pnpm test:cov`: cobertura mínima de los módulos del portal (unitarias + integración).
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: [
    'src/modules/users/**/*.ts',
    'src/modules/media/**/*.ts',
    'src/modules/posts/**/*.ts',
    'src/common/rate-limit/**/*.ts',
    'src/modules/reactions/**/*.ts',
    'src/modules/comments/**/*.ts',
    'src/modules/shares/**/*.ts',
    'src/modules/notifications/**/*.ts',
    'src/common/dataloaders/**/*.ts',
    'src/workers/media.processor.ts',
    'src/workers/posts.processor.ts',
    '!**/*.spec.ts',
    '!**/*.module.ts',
  ],
  coverageThreshold: {
    './src/modules/users/': { statements: 80, branches: 80, functions: 80, lines: 80 },
    './src/modules/media/': { statements: 80, branches: 80, functions: 80, lines: 80 },
    './src/modules/posts/': { statements: 80, branches: 80, functions: 80, lines: 80 },
    './src/common/rate-limit/': { statements: 80, branches: 80, functions: 80, lines: 80 },
    './src/modules/reactions/': { statements: 80, branches: 80, functions: 80, lines: 80 },
    './src/modules/comments/': { statements: 80, branches: 80, functions: 80, lines: 80 },
    './src/modules/shares/': { statements: 80, branches: 80, functions: 80, lines: 80 },
    './src/modules/notifications/': { statements: 80, branches: 80, functions: 80, lines: 80 },
  },
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      rootDir: __dirname,
      roots: ['<rootDir>/src'],
      testRegex: '\\.spec\\.ts$',
      transform,
    },
    {
      displayName: 'e2e',
      testEnvironment: 'node',
      rootDir: __dirname,
      roots: ['<rootDir>/test'],
      testRegex: '\\.e2e-spec\\.ts$',
      transform,
      globalSetup: '<rootDir>/test/utils/global-setup.ts',
      globalTeardown: '<rootDir>/test/utils/global-teardown.ts',
      setupFilesAfterEnv: ['<rootDir>/test/utils/setup-e2e.ts'],
    },
  ],
};

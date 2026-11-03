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

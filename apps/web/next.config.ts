import { resolve } from 'node:path';
import { loadEnvConfig } from '@next/env';
import { type NextConfig } from 'next';

// El .env vive en la raíz del monorepo.
loadEnvConfig(resolve(__dirname, '..', '..'));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // ESLint corre aparte con `pnpm lint` (config flat compartida en @sentio/config).
  eslint: { ignoreDuringBuilds: true },
  // Paquetes internos que se publican como TypeScript fuente, más Tamagui/react-native-web.
  transpilePackages: [
    '@sentio/api-client',
    '@sentio/i18n',
    '@sentio/ui',
    'react-native-web',
    'tamagui',
    '@tamagui/config',
  ],
  webpack: (
    config: { resolve: { alias: Record<string, string>; extensions: string[] } },
    { webpack },
  ) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native$': 'react-native-web',
    };
    config.resolve.extensions = ['.web.tsx', '.web.ts', '.web.js', ...config.resolve.extensions];
    (config as unknown as { plugins: unknown[] }).plugins.push(
      new webpack.DefinePlugin({ 'process.env.TAMAGUI_TARGET': JSON.stringify('web') }),
    );
    return config;
  },
};

export default nextConfig;

import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Variables EXPO_PUBLIC_*. Expo las sustituye en el bundle solo con acceso estático
 * (`process.env.EXPO_PUBLIC_X`), así que no se leen con un helper dinámico.
 * Se tipan explícitamente porque expo-modules-core declara `process.env` con índice `any`.
 */
const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL as string | undefined,
  privacyNoticeUrl: process.env.EXPO_PUBLIC_PRIVACY_NOTICE_URL as string | undefined,
  arcoContactEmail: process.env.EXPO_PUBLIC_ARCO_CONTACT_EMAIL as string | undefined,
  webUrl: process.env.EXPO_PUBLIC_WEB_URL as string | undefined,
};

/**
 * URL de la API. Prioridad:
 *  1. EXPO_PUBLIC_API_URL (apps/mobile/.env).
 *  2. La IP de la PC que sirve Metro (funciona en dispositivos físicos con Expo Go).
 *  3. localhost (10.0.2.2 en el emulador de Android).
 */
function resolveApiUrl(): string {
  if (env.apiUrl) return env.apiUrl;

  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:4000/graphql`;

  return Platform.OS === 'android'
    ? 'http://10.0.2.2:4000/graphql'
    : 'http://localhost:4000/graphql';
}

export const API_URL = resolveApiUrl();
export const PRIVACY_NOTICE_URL =
  env.privacyNoticeUrl ?? 'http://localhost:3000/es/aviso-de-privacidad';
export const PRIVACY_CONTACT = env.arcoContactEmail ?? 'privacidad@example.com';
/** URL pública de la web, para los enlaces "Compartir fuera de la app". */
export const WEB_URL = env.webUrl ?? 'http://localhost:3000';

import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * URL de la API. Prioridad:
 *  1. EXPO_PUBLIC_API_URL (apps/mobile/.env).
 *  2. La IP de la PC que sirve Metro (funciona en dispositivos físicos con Expo Go).
 *  3. localhost (10.0.2.2 en el emulador de Android).
 */
function resolveApiUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return explicit;

  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:4000/graphql`;

  return Platform.OS === 'android'
    ? 'http://10.0.2.2:4000/graphql'
    : 'http://localhost:4000/graphql';
}

export const API_URL = resolveApiUrl();
export const PRIVACY_NOTICE_URL =
  process.env.EXPO_PUBLIC_PRIVACY_NOTICE_URL ?? 'http://localhost:3000/es/aviso-de-privacidad';
export const PRIVACY_CONTACT =
  process.env.EXPO_PUBLIC_ARCO_CONTACT_EMAIL ?? 'privacidad@example.com';

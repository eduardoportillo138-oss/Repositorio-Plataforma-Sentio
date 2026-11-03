import { createMemoryTokenStorage, type TokenStorage } from '@sentio/api-client';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REFRESH_KEY = 'sentio.refreshToken';

/**
 * Access token en memoria y refresh token en el almacenamiento seguro del sistema
 * (Keychain en iOS, Keystore en Android). En web (expo start --web) no se persiste.
 */
export function createSecureTokenStorage(): TokenStorage {
  if (Platform.OS === 'web') return createMemoryTokenStorage();

  return createMemoryTokenStorage({
    getRefreshToken: () => SecureStore.getItemAsync(REFRESH_KEY),
    setRefreshToken: async (token) => {
      if (token) {
        await SecureStore.setItemAsync(REFRESH_KEY, token, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
        });
      } else {
        await SecureStore.deleteItemAsync(REFRESH_KEY);
      }
    },
  });
}

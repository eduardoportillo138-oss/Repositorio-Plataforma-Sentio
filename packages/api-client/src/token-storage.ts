/**
 * Dónde guarda cada plataforma las credenciales:
 *  - Web: access token solo en memoria; el refresh token vive en una cookie httpOnly (no accesible a JS).
 *  - Móvil: access token en memoria; refresh token en el almacenamiento seguro del sistema
 *    (expo-secure-store → Keychain / Keystore). La implementación vive en apps/mobile.
 */
export interface TokenStorage {
  getAccessToken(): string | null;
  setAccessToken(token: string | null): void;
  /** `null` en web: el navegador envía la cookie automáticamente. */
  getRefreshToken(): Promise<string | null>;
  setRefreshToken(token: string | null): Promise<void>;
  clear(): Promise<void>;
}

/** Access token en memoria. `refresh` permite delegar el refresh token a otro almacén. */
export function createMemoryTokenStorage(
  refresh: Pick<TokenStorage, 'getRefreshToken' | 'setRefreshToken'> = {
    getRefreshToken: () => Promise.resolve(null),
    setRefreshToken: () => Promise.resolve(),
  },
): TokenStorage {
  let accessToken: string | null = null;
  return {
    getAccessToken: () => accessToken,
    setAccessToken: (token) => {
      accessToken = token;
    },
    getRefreshToken: () => refresh.getRefreshToken(),
    setRefreshToken: (token) => refresh.setRefreshToken(token),
    clear: async () => {
      accessToken = null;
      await refresh.setRefreshToken(null);
    },
  };
}

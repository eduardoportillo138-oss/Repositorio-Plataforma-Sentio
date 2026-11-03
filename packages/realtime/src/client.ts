import { io, type Socket } from 'socket.io-client';
import {
  REALTIME_NAMESPACE,
  type ClientToServerEvents,
  type HandshakeAuth,
  type ServerToClientEvents,
} from './events';

export type RealtimeSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface RealtimeClientOptions {
  /** URL base de la API, p. ej. http://localhost:4000 */
  url: string;
  /** Devuelve el access token vigente; se consulta en cada (re)conexión. */
  getAccessToken: () => string | null | Promise<string | null>;
}

/** Crea un socket tipado. No conecta hasta llamar a `socket.connect()`. */
export function createRealtimeClient({
  url,
  getAccessToken,
}: RealtimeClientOptions): RealtimeSocket {
  return io(`${url.replace(/\/$/, '')}${REALTIME_NAMESPACE}`, {
    autoConnect: false,
    transports: ['websocket'],
    auth: (cb: (data: HandshakeAuth) => void) => {
      void Promise.resolve(getAccessToken()).then((token) => cb({ token: token ?? '' }));
    },
  });
}

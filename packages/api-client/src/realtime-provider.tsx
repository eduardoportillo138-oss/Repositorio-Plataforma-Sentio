'use client';

import {
  createRealtimeClient,
  type RealtimeSocket,
  type ServerToClientEvents,
} from '@sentio/realtime';
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { type TokenStorage } from './token-storage';

const RealtimeContext = createContext<RealtimeSocket | null>(null);

/** Deriva la URL base de Socket.IO de la URL GraphQL (http://host:4000/graphql → http://host:4000). */
export function realtimeUrlFrom(graphqlUri: string): string {
  return graphqlUri.replace(/\/graphql\/?$/, '');
}

export interface RealtimeProviderProps {
  url: string;
  tokens: TokenStorage;
  /** Conecta solo con sesión iniciada; al cerrar sesión desconecta. */
  enabled: boolean;
  children: ReactNode;
}

/** Mantiene un socket por sesión y lo comparte con `useRealtimeEvent`. */
export function RealtimeProvider({ url, tokens, enabled, children }: RealtimeProviderProps) {
  const [socket, setSocket] = useState<RealtimeSocket | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const s = createRealtimeClient({ url, getAccessToken: () => tokens.getAccessToken() });
    s.connect();
    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [enabled, url, tokens]);

  return <RealtimeContext.Provider value={socket}>{children}</RealtimeContext.Provider>;
}

export function useRealtimeSocket(): RealtimeSocket | null {
  return useContext(RealtimeContext);
}

/**
 * Se suscribe a un evento del servidor mientras el componente esté montado.
 * El handler puede cambiar entre renders sin volver a suscribirse.
 */
export function useRealtimeEvent<E extends keyof ServerToClientEvents>(
  event: E,
  handler: ServerToClientEvents[E],
): void {
  const socket = useRealtimeSocket();
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    if (!socket) return;
    const listener = ((...args: Parameters<ServerToClientEvents[E]>) =>
      (ref.current as (...a: unknown[]) => void)(...args)) as never;
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [socket, event]);
}

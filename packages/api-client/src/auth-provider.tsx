'use client';

import { ApolloProvider } from '@apollo/client';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createApolloClient, type CreateApolloClientOptions } from './client';
import {
  type AuthPayloadFieldsFragment,
  LoginDocument,
  type LoginInput,
  type LoginMutation,
  type LoginMutationVariables,
  LogoutDocument,
  type LogoutMutation,
  type LogoutMutationVariables,
  RegisterDocument,
  type RegisterInput,
  type RegisterMutation,
  type RegisterMutationVariables,
  type ViewerFieldsFragment,
} from './generated/graphql';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface AuthContextValue {
  status: AuthStatus;
  viewer: ViewerFieldsFragment | null;
  login: (input: LoginInput) => Promise<ViewerFieldsFragment>;
  register: (input: RegisterInput) => Promise<ViewerFieldsFragment>;
  logout: (allDevices?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export type SentioApiProviderProps = Omit<
  CreateApolloClientOptions,
  'onSessionExpired' | 'onTokensRefreshed'
> & {
  children: ReactNode;
};

/**
 * Crea el Apollo Client y gestiona la sesión. Al montar intenta restaurarla con el refresh token
 * (cookie en web, almacenamiento seguro en móvil).
 */
export function SentioApiProvider({ children, ...options }: SentioApiProviderProps) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [viewer, setViewer] = useState<ViewerFieldsFragment | null>(null);

  const { client, refresh } = useMemo(
    () =>
      createApolloClient({
        ...options,
        onSessionExpired: () => {
          setViewer(null);
          setStatus('anonymous');
        },
        onTokensRefreshed: (payload) => setViewer(payload.user),
      }),
    // El cliente se crea una sola vez por montaje del provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    let cancelled = false;
    void refresh().then((payload) => {
      if (cancelled) return;
      setViewer(payload?.user ?? null);
      setStatus(payload ? 'authenticated' : 'anonymous');
    });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const accept = useCallback(
    async (payload: AuthPayloadFieldsFragment) => {
      options.tokens.setAccessToken(payload.accessToken);
      if (payload.refreshToken) await options.tokens.setRefreshToken(payload.refreshToken);
      setViewer(payload.user);
      setStatus('authenticated');
      return payload.user;
    },
    [options.tokens],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      viewer,
      login: async (input) => {
        const { data } = await client.mutate<LoginMutation, LoginMutationVariables>({
          mutation: LoginDocument,
          variables: { input },
        });
        if (!data) throw new Error('Respuesta vacía de login');
        return accept(data.login);
      },
      register: async (input) => {
        const { data } = await client.mutate<RegisterMutation, RegisterMutationVariables>({
          mutation: RegisterDocument,
          variables: { input },
        });
        if (!data) throw new Error('Respuesta vacía de register');
        return accept(data.register);
      },
      logout: async (allDevices = false) => {
        try {
          await client.mutate<LogoutMutation, LogoutMutationVariables>({
            mutation: LogoutDocument,
            variables: { allDevices },
          });
        } finally {
          await options.tokens.clear();
          await client.clearStore();
          setViewer(null);
          setStatus('anonymous');
        }
      },
    }),
    [status, viewer, client, accept, options.tokens],
  );

  return (
    <ApolloProvider client={client}>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </ApolloProvider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <SentioApiProvider>.');
  return ctx;
}

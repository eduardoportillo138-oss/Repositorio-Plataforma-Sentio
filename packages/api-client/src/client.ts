import {
  ApolloClient,
  ApolloLink,
  fromPromise,
  HttpLink,
  InMemoryCache,
  type NormalizedCacheObject,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { relayStylePagination } from '@apollo/client/utilities';
import { ErrorCode } from '@sentio/core';
import { print } from 'graphql';
import {
  type AuthPayloadFieldsFragment,
  RefreshTokenDocument,
  type RefreshTokenMutation,
} from './generated/graphql';
import { type TokenStorage } from './token-storage';

export type ClientPlatform = 'web' | 'native';

export interface CreateApolloClientOptions {
  /** URL del endpoint GraphQL, p. ej. http://localhost:4000/graphql */
  uri: string;
  platform: ClientPlatform;
  tokens: TokenStorage;
  /** Se llama cuando el refresh falla (sesión expirada o revocada). */
  onSessionExpired?: () => void;
  /** Se llama cada vez que se obtiene un par de tokens nuevo mediante refresh. */
  onTokensRefreshed?: (payload: AuthPayloadFieldsFragment) => void;
  fetch?: typeof fetch;
}

/** Operaciones que nunca deben disparar el refresh automático (evita bucles). */
const AUTH_OPERATIONS = new Set(['Login', 'Register', 'RefreshToken']);

export interface SentioApolloClient {
  client: ApolloClient<NormalizedCacheObject>;
  /** Canjea el refresh token por uno nuevo. Las llamadas concurrentes comparten la misma petición. */
  refresh: () => Promise<AuthPayloadFieldsFragment | null>;
}

export function createApolloClient(options: CreateApolloClientOptions): SentioApolloClient {
  const { uri, platform, tokens } = options;
  const fetchImpl = options.fetch ?? fetch;
  const platformHeaders: Record<string, string> = platform === 'web' ? { 'x-client': 'web' } : {};

  let inflight: Promise<AuthPayloadFieldsFragment | null> | null = null;

  async function doRefresh(): Promise<AuthPayloadFieldsFragment | null> {
    const stored = await tokens.getRefreshToken();
    if (platform === 'native' && !stored) return null;

    const res = await fetchImpl(uri, {
      method: 'POST',
      credentials: platform === 'web' ? 'include' : 'omit',
      headers: { 'content-type': 'application/json', ...platformHeaders },
      body: JSON.stringify({
        operationName: 'RefreshToken',
        query: print(RefreshTokenDocument),
        variables: { token: stored },
      }),
    });
    const body = (await res.json()) as { data?: RefreshTokenMutation | null; errors?: unknown[] };
    const payload = body.data?.refreshToken ?? null;
    if (!payload) {
      await tokens.clear();
      return null;
    }
    tokens.setAccessToken(payload.accessToken);
    if (payload.refreshToken) await tokens.setRefreshToken(payload.refreshToken);
    options.onTokensRefreshed?.(payload);
    return payload;
  }

  const refresh = (): Promise<AuthPayloadFieldsFragment | null> => {
    inflight ??= doRefresh()
      .catch(() => null)
      .finally(() => {
        inflight = null;
      });
    return inflight;
  };

  const authLink = setContext((_, { headers }: { headers?: Record<string, string> }) => {
    const token = tokens.getAccessToken();
    return {
      headers: {
        ...headers,
        ...platformHeaders,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    };
  });

  // Si el access token expiró, refresca una vez y reintenta la operación.
  const refreshLink = onError(({ graphQLErrors, operation, forward }) => {
    const unauthenticated = graphQLErrors?.some(
      (e) => e.extensions?.code === ErrorCode.UNAUTHENTICATED,
    );
    if (!unauthenticated || AUTH_OPERATIONS.has(operation.operationName)) return;
    if ((operation.getContext() as { retried?: boolean }).retried) return;

    return fromPromise(refresh()).flatMap((payload) => {
      // Sin sesión: se avisa a la app y el reintento devuelve UNAUTHENTICATED al llamador.
      if (!payload) options.onSessionExpired?.();
      operation.setContext({ retried: true });
      return forward(operation);
    });
  });

  const httpLink = new HttpLink({
    uri,
    fetch: fetchImpl,
    credentials: platform === 'web' ? 'include' : 'omit',
  });

  const client = new ApolloClient({
    link: ApolloLink.from([refreshLink, authLink, httpLink]),
    cache: createCache(),
    defaultOptions: { watchQuery: { fetchPolicy: 'cache-and-network' } },
  });

  return { client, refresh };
}

/**
 * Caché normalizada. Las listas paginadas por cursor se fusionan página tras página
 * (relayStylePagination); pedir sin `after` (refetch) reemplaza la lista.
 */
export function createCache(): InMemoryCache {
  return new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          homeFeed: relayStylePagination([]),
          userPosts: relayStylePagination(['handle']),
        },
      },
    },
  });
}

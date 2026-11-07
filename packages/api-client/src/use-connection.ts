'use client';

import { type ApolloError, NetworkStatus } from '@apollo/client';
import { useCallback, useMemo, useRef, useState } from 'react';

interface ConnectionShape<N> {
  edges: readonly { node: N }[];
  pageInfo: { hasNextPage: boolean; endCursor?: string | null };
}

/** Lo mínimo que se usa de un `QueryResult` de Apollo. */
interface PagedQueryResult<TData> {
  data?: TData | undefined;
  loading: boolean;
  error?: ApolloError | undefined;
  networkStatus: NetworkStatus;
  fetchMore: (options: { variables: { after: string } }) => Promise<unknown>;
  refetch: () => Promise<unknown>;
}

export interface ConnectionState<N> {
  items: N[];
  hasMore: boolean;
  /** Primera carga (sin datos todavía): mostrar skeleton. */
  initialLoading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: ApolloError | undefined;
  /** Pide la siguiente página. Ignora llamadas repetidas mientras hay una en curso. */
  loadMore: () => Promise<void>;
  /** Recarga desde la primera página (pull-to-refresh, reintentar). */
  refresh: () => Promise<void>;
}

/**
 * Convierte una query paginada por cursor (Relay) en una lista para scroll infinito,
 * igual en web y móvil. La query debe usar `notifyOnNetworkStatusChange: true`.
 */
export function useConnection<TData, N>(
  result: PagedQueryResult<TData>,
  select: (data: TData) => ConnectionShape<N> | null | undefined,
): ConnectionState<N> {
  const connection = result.data ? select(result.data) : null;
  const inFlight = useRef(false);
  const [refreshing, setRefreshing] = useState(false);

  const items = useMemo(() => connection?.edges.map((e) => e.node) ?? [], [connection]);
  const hasMore = Boolean(connection?.pageInfo.hasNextPage);
  const endCursor = connection?.pageInfo.endCursor ?? null;
  const { fetchMore, refetch } = result;

  const loadMore = useCallback(async () => {
    if (inFlight.current || !hasMore || !endCursor) return;
    inFlight.current = true;
    try {
      await fetchMore({ variables: { after: endCursor } });
    } finally {
      inFlight.current = false;
    }
  }, [fetchMore, hasMore, endCursor]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return {
    items,
    hasMore,
    initialLoading: result.loading && !connection,
    loadingMore: result.networkStatus === NetworkStatus.fetchMore,
    refreshing,
    error: result.error,
    loadMore,
    refresh,
  };
}

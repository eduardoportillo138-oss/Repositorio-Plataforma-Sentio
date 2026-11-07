'use client';

import { SEARCH_QUERY_MIN_LENGTH } from '@sentio/core';
import { useCallback } from 'react';
import {
  RecentSearchesDocument,
  useClearSearchHistoryMutation,
  useRecentSearchesQuery,
  useSearchPostsQuery,
} from './generated/graphql';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from './interactions';
import { useConnection } from './use-connection';

export type SearchTab = 'users' | 'posts';

export function isSearchTab(value: unknown): value is SearchTab {
  return value === 'users' || value === 'posts';
}

/** Búsqueda de publicaciones con debounce de 300 ms (no consulta con menos de 2 caracteres). */
export function usePostSearch(text: string, active = true) {
  const query = useDebouncedValue(text.trim(), SEARCH_DEBOUNCE_MS);
  const enabled = active && query.length >= SEARCH_QUERY_MIN_LENGTH;
  const result = useSearchPostsQuery({
    variables: { query },
    skip: !enabled,
    notifyOnNetworkStatusChange: true,
  });
  const connection = useConnection(result, (d) => d.searchPosts);
  return { ...connection, query, enabled, pending: text.trim() !== query };
}

/** Búsquedas recientes del usuario y "Borrar historial". */
export function useRecentSearches() {
  const { data, loading, refetch } = useRecentSearchesQuery({ fetchPolicy: 'cache-and-network' });
  const [clearMutation, { loading: clearing }] = useClearSearchHistoryMutation();
  const clear = useCallback(async () => {
    await clearMutation({ refetchQueries: [RecentSearchesDocument], awaitRefetchQueries: true });
  }, [clearMutation]);
  return {
    items: data?.recentSearches ?? [],
    loading: loading && !data,
    refresh: refetch,
    clear,
    clearing,
  };
}

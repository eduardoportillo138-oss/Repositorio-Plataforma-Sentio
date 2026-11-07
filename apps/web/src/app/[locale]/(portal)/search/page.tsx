'use client';

import {
  isSearchTab,
  type SearchTab,
  usePostSearch,
  useRecentSearches,
  useUserSearch,
} from '@sentio/api-client';
import { SEARCH_QUERY_MIN_LENGTH } from '@sentio/core';
import { useTranslation } from '@sentio/i18n';
import {
  Paragraph,
  RecentSearchList,
  SearchField,
  SegmentedControl,
  Spinner,
  YStack,
} from '@sentio/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { PostResults, UserResults } from '@/components/SearchResults';

/** URL de búsqueda: ?q=…&tab=users|posts (q vacío no se incluye). */
function searchUrl(pathname: string, q: string, tab: SearchTab): string {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  params.set('tab', tab);
  return `${pathname}?${params.toString()}`;
}

function SearchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const urlQuery = params.get('q') ?? '';
  const urlTab = params.get('tab');
  const tab: SearchTab = isSearchTab(urlTab) ? urlTab : 'users';

  const [text, setText] = useState(urlQuery);
  const lastPushed = useRef(urlQuery);

  // Atrás/adelante del navegador: la URL manda sobre el campo.
  useEffect(() => {
    if (urlQuery !== lastPushed.current) {
      lastPushed.current = urlQuery;
      setText(urlQuery);
    }
  }, [urlQuery]);

  const users = useUserSearch(text, tab === 'users');
  const posts = usePostSearch(text, tab === 'posts');
  const active = tab === 'users' ? users : posts;
  const recent = useRecentSearches();
  const { refresh: refreshRecent } = recent;

  // Al escribir, la URL refleja la búsqueda sin llenar el historial (replace).
  useEffect(() => {
    const q = active.query;
    if (q === lastPushed.current) return;
    lastPushed.current = q;
    router.replace(searchUrl(pathname, q, tab), { scroll: false });
  }, [active.query, pathname, router, tab]);

  const trimmed = text.trim();
  useEffect(() => {
    if (!trimmed) void refreshRecent();
  }, [trimmed, refreshRecent]);

  // Cambiar de pestaña o elegir una reciente sí crea una entrada (push): "atrás" la deshace.
  const changeTab = useCallback(
    (next: SearchTab) => {
      lastPushed.current = trimmed;
      router.push(searchUrl(pathname, trimmed, next), { scroll: false });
    },
    [router, pathname, trimmed],
  );
  const pickRecent = useCallback(
    (q: string) => {
      setText(q);
      lastPushed.current = q;
      router.push(searchUrl(pathname, q, tab), { scroll: false });
    },
    [router, pathname, tab],
  );

  return (
    <YStack width="100%" maxWidth={640} alignSelf="center" gap="$3" paddingTop="$4">
      <YStack paddingHorizontal="$4" gap="$3">
        <SearchField
          value={text}
          onChangeText={setText}
          label={t('search.label')}
          placeholder={t('search.placeholder')}
          clearLabel={t('search.clear')}
          autoFocus
        />
        <SegmentedControl<SearchTab>
          label={t('search.tabs')}
          value={tab}
          onChange={changeTab}
          options={[
            { value: 'users', label: t('search.users') },
            { value: 'posts', label: t('search.posts') },
          ]}
        />
      </YStack>

      <YStack role="tabpanel" aria-label={tab === 'users' ? t('search.users') : t('search.posts')}>
        {!trimmed ? (
          recent.loading ? (
            <YStack alignItems="center" padding="$4">
              <Spinner />
            </YStack>
          ) : (
            <RecentSearchList
              items={recent.items}
              title={t('search.recent')}
              emptyLabel={t('search.noRecent')}
              clearLabel={t('search.clearHistory')}
              clearing={recent.clearing}
              onSelect={pickRecent}
              onClear={() => void recent.clear()}
            />
          )
        ) : trimmed.length < SEARCH_QUERY_MIN_LENGTH ? (
          <Paragraph textAlign="center" color="$color10" padding="$5">
            {t('search.hint')}
          </Paragraph>
        ) : tab === 'users' ? (
          <UserResults feed={users} query={users.query} />
        ) : (
          <PostResults feed={posts} query={posts.query} />
        )}
      </YStack>
    </YStack>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <YStack alignItems="center" padding="$6">
          <Spinner />
        </YStack>
      }
    >
      <SearchScreen />
    </Suspense>
  );
}

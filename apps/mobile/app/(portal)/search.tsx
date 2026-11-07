import {
  type PostFieldsFragment,
  type SearchTab,
  usePostSearch,
  useRecentSearches,
  type UserSearchFieldsFragment,
  useUserSearch,
} from '@sentio/api-client';
import { highlightRanges, SEARCH_QUERY_MIN_LENGTH, snippetAround } from '@sentio/core';
import { useDynamicT, useRelativeTime, useTranslation } from '@sentio/i18n';
import {
  ErrorState,
  HighlightedText,
  Paragraph,
  PostCard,
  PostCardSkeleton,
  RecentSearchList,
  SearchField,
  SegmentedControl,
  Spinner,
  UserRow,
  YStack,
} from '@sentio/ui';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserAvatar } from '@/components/UserAvatar';

type Row =
  { kind: 'user'; user: UserSearchFieldsFragment } | { kind: 'post'; post: PostFieldsFragment };

export default function SearchScreen() {
  const { t } = useTranslation();
  const tr = useDynamicT();
  const relative = useRelativeTime();
  const router = useRouter();
  const [text, setText] = useState('');
  // Al cambiar de pestaña se conserva el texto y se repite la búsqueda en la otra categoría.
  const [tab, setTab] = useState<SearchTab>('users');

  const users = useUserSearch(text, tab === 'users');
  const posts = usePostSearch(text, tab === 'posts');
  const recent = useRecentSearches();
  const { refresh: refreshRecent } = recent;
  const trimmed = text.trim();

  useEffect(() => {
    if (!trimmed) void refreshRecent();
  }, [trimmed, refreshRecent]);

  const feed = tab === 'users' ? users : posts;
  const query = feed.query;
  const rows: Row[] =
    tab === 'users'
      ? users.items.map((user) => ({ kind: 'user', user }))
      : posts.items.map((post) => ({ kind: 'post', post }));

  const renderRow = ({ item }: { item: Row }) => {
    if (item.kind === 'user') {
      const u = item.user;
      return (
        <UserRow
          avatar={<UserAvatar name={u.displayName} avatar={u.avatar} size={44} />}
          displayName={u.displayName}
          handle={u.handle}
          tags={u.tags.map((k) => tr(`profile.qualities.${k}`) ?? k)}
          onPress={() => router.push(`/u/${u.handle}`)}
        />
      );
    }
    const p = item.post;
    return (
      <PostCard
        compact
        authorName={p.author.displayName}
        authorHandle={p.author.handle}
        authorAvatar={<UserAvatar name={p.author.displayName} avatar={p.author.avatar} size={32} />}
        onAuthorPress={() => router.push(`/u/${p.author.handle}`)}
        timeLabel={relative(p.createdAt)}
        title={p.title}
        text={snippetAround(p.text, query, 140)}
        renderTitle={(title) => (
          <HighlightedText text={title} ranges={highlightRanges(title, query)} />
        )}
        renderText={(body) => <HighlightedText text={body} ranges={highlightRanges(body, query)} />}
        seeMoreLabel={t('post.seeMore')}
        seeLessLabel={t('post.seeLess')}
        onPress={() => router.push(`/post/${p.id}`)}
      />
    );
  };

  const body = () => {
    if (!trimmed) {
      return recent.loading ? (
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
          onSelect={setText}
          onClear={() => void recent.clear()}
        />
      );
    }
    if (trimmed.length < SEARCH_QUERY_MIN_LENGTH) {
      return (
        <Paragraph textAlign="center" color="$color10" padding="$5">
          {t('search.hint')}
        </Paragraph>
      );
    }
    return (
      <FlashList
        data={rows}
        keyExtractor={(r) => (r.kind === 'user' ? `u:${r.user.id}` : `p:${r.post.id}`)}
        renderItem={renderRow}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          feed.initialLoading || feed.pending ? (
            <PostCardSkeleton />
          ) : feed.error ? (
            <ErrorState
              message={t('search.error')}
              retryLabel={t('feed.retry')}
              onRetry={() => void feed.refresh()}
            />
          ) : (
            <Paragraph textAlign="center" color="$color10" padding="$6">
              {t('search.noResults', { query })}
            </Paragraph>
          )
        }
        ListFooterComponent={
          feed.loadingMore ? (
            <YStack alignItems="center" padding="$3">
              <Spinner />
            </YStack>
          ) : null
        }
        onEndReached={() => {
          if (feed.hasMore && !feed.loadingMore) void feed.loadMore();
        }}
        onEndReachedThreshold={0.5}
        refreshing={feed.refreshing}
        onRefresh={() => void feed.refresh()}
      />
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack paddingHorizontal="$4" paddingTop="$2" paddingBottom="$3" gap="$3">
        <SearchField
          value={text}
          onChangeText={setText}
          label={t('search.label')}
          placeholder={t('search.placeholder')}
          clearLabel={t('search.clear')}
        />
        <SegmentedControl<SearchTab>
          label={t('search.tabs')}
          value={tab}
          onChange={setTab}
          options={[
            { value: 'users', label: t('search.users') },
            { value: 'posts', label: t('search.posts') },
          ]}
        />
      </YStack>
      <YStack flex={1}>{body()}</YStack>
    </SafeAreaView>
  );
}

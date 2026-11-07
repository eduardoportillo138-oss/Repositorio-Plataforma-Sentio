'use client';

import {
  type ConnectionState,
  type PostFieldsFragment,
  type UserSearchFieldsFragment,
} from '@sentio/api-client';
import { highlightRanges, snippetAround } from '@sentio/core';
import { useDynamicT, useRelativeTime, useTranslation } from '@sentio/i18n';
import {
  ErrorState,
  HighlightedText,
  Paragraph,
  PostCard,
  PostCardSkeleton,
  Spinner,
  UserRow,
  YStack,
} from '@sentio/ui';
import { useParams, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useRef } from 'react';
import { UserAvatar } from './UserAvatar';

/** Lista con skeleton, vacío ("Sin resultados para…"), error y scroll infinito por sentinela. */
function ResultList<N extends { id: string }>({
  feed,
  query,
  render,
}: {
  feed: ConnectionState<N> & { pending: boolean };
  query: string;
  render: (item: N) => ReactNode;
}) {
  const { t } = useTranslation();
  const sentinel = useRef<HTMLDivElement>(null);
  const { hasMore, loadMore } = feed;

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && hasMore) void loadMore();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  if (feed.initialLoading || (feed.pending && feed.items.length === 0)) {
    return (
      <YStack aria-busy>
        <PostCardSkeleton />
        <PostCardSkeleton />
      </YStack>
    );
  }
  if (feed.error && feed.items.length === 0) {
    return (
      <ErrorState
        message={t('search.error')}
        retryLabel={t('feed.retry')}
        onRetry={() => void feed.refresh()}
      />
    );
  }
  if (feed.items.length === 0) {
    return (
      <Paragraph textAlign="center" color="$color10" padding="$6" role="status">
        {t('search.noResults', { query })}
      </Paragraph>
    );
  }
  return (
    <YStack>
      {feed.items.map((item) => (
        <YStack key={item.id}>{render(item)}</YStack>
      ))}
      <div ref={sentinel} />
      {feed.loadingMore ? (
        <YStack alignItems="center" padding="$3">
          <Spinner />
        </YStack>
      ) : null}
    </YStack>
  );
}

export function UserResults({
  feed,
  query,
}: {
  feed: ConnectionState<UserSearchFieldsFragment> & { pending: boolean };
  query: string;
}) {
  const tr = useDynamicT();
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  return (
    <ResultList
      feed={feed}
      query={query}
      render={(u) => (
        <UserRow
          avatar={<UserAvatar name={u.displayName} avatar={u.avatar} size={44} />}
          displayName={u.displayName}
          handle={u.handle}
          tags={u.tags.map((k) => tr(`profile.qualities.${k}`) ?? k)}
          onPress={() => router.push(`/${locale}/u/${u.handle}`)}
        />
      )}
    />
  );
}

export function PostResults({
  feed,
  query,
}: {
  feed: ConnectionState<PostFieldsFragment> & { pending: boolean };
  query: string;
}) {
  const { t } = useTranslation();
  const relative = useRelativeTime();
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  return (
    <ResultList
      feed={feed}
      query={query}
      render={(p) => {
        const snippet = snippetAround(p.text, query, 160);
        return (
          <PostCard
            compact
            authorName={p.author.displayName}
            authorHandle={p.author.handle}
            authorAvatar={
              <UserAvatar name={p.author.displayName} avatar={p.author.avatar} size={32} />
            }
            onAuthorPress={() => router.push(`/${locale}/u/${p.author.handle}`)}
            timeLabel={relative(p.createdAt)}
            title={p.title}
            text={snippet}
            renderTitle={(title) => (
              <HighlightedText text={title} ranges={highlightRanges(title, query)} />
            )}
            renderText={(text) => (
              <HighlightedText text={text} ranges={highlightRanges(text, query)} />
            )}
            seeMoreLabel={t('post.seeMore')}
            seeLessLabel={t('post.seeLess')}
            onPress={() => router.push(`/${locale}/post/${p.id}`)}
          />
        );
      }}
    />
  );
}

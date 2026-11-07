'use client';

import { type ConnectionState, type PostFieldsFragment } from '@sentio/api-client';
import { useTranslation } from '@sentio/i18n';
import { ErrorState, Paragraph, PostCardSkeleton, YStack } from '@sentio/ui';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PostItem } from './PostItem';

/** Se pide la siguiente página cuando faltan estos ítems para el final. */
const PREFETCH_DISTANCE = 5;
const ESTIMATED_ITEM_HEIGHT = 180;

export interface PostListProps {
  feed: ConnectionState<PostFieldsFragment>;
  empty: ReactNode;
}

/**
 * Lista virtualizada con el scroll de la ventana (TanStack Virtual): solo monta en el DOM las
 * tarjetas visibles, mide su altura real y pide la siguiente página al acercarse al final.
 */
export function PostList({ feed, empty }: PostListProps) {
  const { t } = useTranslation();
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  // Distancia del inicio de la lista al inicio del documento (encabezado, pestañas…).
  useLayoutEffect(() => {
    const update = () => setScrollMargin(listRef.current?.offsetTop ?? 0);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: feed.items.length,
    estimateSize: () => ESTIMATED_ITEM_HEIGHT,
    overscan: 4,
    scrollMargin,
    getItemKey: (index) => feed.items[index]?.id ?? index,
  });
  const virtualItems = virtualizer.getVirtualItems();
  const lastIndex = virtualItems.at(-1)?.index ?? -1;

  const { hasMore, loadingMore, loadMore } = feed;
  useEffect(() => {
    if (hasMore && !loadingMore && lastIndex >= feed.items.length - PREFETCH_DISTANCE) {
      void loadMore();
    }
  }, [lastIndex, feed.items.length, hasMore, loadingMore, loadMore]);

  if (feed.initialLoading) {
    return (
      <YStack aria-busy aria-label={t('common.loading')}>
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
      </YStack>
    );
  }

  if (feed.error && feed.items.length === 0) {
    return (
      <ErrorState
        message={t('feed.error')}
        retryLabel={t('feed.retry')}
        retrying={feed.refreshing}
        onRetry={() => void feed.refresh()}
      />
    );
  }

  if (feed.items.length === 0) return <>{empty}</>;

  return (
    <div ref={listRef}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
        {virtualItems.map((item) => {
          const post = feed.items[item.index];
          if (!post) return null;
          return (
            <div
              key={item.key}
              data-index={item.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${item.start - virtualizer.options.scrollMargin}px)`,
              }}
            >
              <PostItem post={post} />
            </div>
          );
        })}
      </div>
      {loadingMore ? (
        <YStack aria-busy aria-label={t('feed.loadingMore')}>
          <PostCardSkeleton />
        </YStack>
      ) : null}
      {feed.error ? (
        <ErrorState
          message={t('feed.error')}
          retryLabel={t('feed.retry')}
          onRetry={() => void feed.loadMore()}
        />
      ) : null}
      {!hasMore ? (
        <Paragraph textAlign="center" color="$color9" padding="$5">
          {t('feed.end')}
        </Paragraph>
      ) : null}
    </div>
  );
}

import { type ConnectionState, type PostFieldsFragment } from '@sentio/api-client';
import { useTranslation } from '@sentio/i18n';
import { ErrorState, Paragraph, PostCardSkeleton, YStack } from '@sentio/ui';
import { FlashList, type ViewToken } from '@shopify/flash-list';
import { type ReactElement, useCallback, useRef } from 'react';
import { PostItem } from './PostItem';

/** Se pide la siguiente página cuando faltan estos ítems para el final. */
const PREFETCH_DISTANCE = 5;

export interface PostListProps {
  feed: ConnectionState<PostFieldsFragment>;
  empty: ReactElement;
  /** Encabezado que se desplaza con la lista (p. ej. el encabezado del perfil). */
  header?: ReactElement;
  /** Espacio extra al final (p. ej. para que el botón flotante no tape la última tarjeta). */
  bottomInset?: number;
}

/** Lista con FlashList: scroll infinito (faltando 5 ítems) y pull-to-refresh. */
export function PostList({ feed, empty, header, bottomInset = 0 }: PostListProps) {
  const { t } = useTranslation();

  // FlashList exige un callback de visibilidad estable: se lee el estado actual por ref.
  const latest = useRef(feed);
  latest.current = feed;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<PostFieldsFragment>[] }) => {
      const f = latest.current;
      const last = viewableItems.reduce((max, v) => Math.max(max, v.index ?? -1), -1);
      if (f.hasMore && !f.loadingMore && last >= f.items.length - PREFETCH_DISTANCE) {
        void f.loadMore();
      }
    },
  ).current;

  const renderItem = useCallback(
    ({ item }: { item: PostFieldsFragment }) => <PostItem post={item} />,
    [],
  );

  const body = () => {
    if (feed.initialLoading) {
      return (
        <YStack>
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
        </YStack>
      );
    }
    if (feed.error) {
      return (
        <ErrorState
          message={t('feed.error')}
          retryLabel={t('feed.retry')}
          retrying={feed.refreshing}
          onRetry={() => void feed.refresh()}
        />
      );
    }
    return empty;
  };

  const footer = () => {
    if (feed.items.length === 0) return null;
    if (feed.loadingMore) return <PostCardSkeleton />;
    if (feed.error) {
      return (
        <ErrorState
          message={t('feed.error')}
          retryLabel={t('feed.retry')}
          onRetry={() => void feed.loadMore()}
        />
      );
    }
    if (!feed.hasMore) {
      return (
        <Paragraph textAlign="center" color="$color9" padding="$5">
          {t('feed.end')}
        </Paragraph>
      );
    }
    return null;
  };

  return (
    <FlashList
      data={feed.items}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={header}
      ListEmptyComponent={body()}
      ListFooterComponent={footer()}
      onViewableItemsChanged={onViewableItemsChanged}
      // Respaldo por si la lista es más corta que la pantalla.
      onEndReached={() => {
        if (feed.hasMore && !feed.loadingMore) void feed.loadMore();
      }}
      onEndReachedThreshold={0.5}
      refreshing={feed.refreshing}
      onRefresh={() => void feed.refresh()}
      contentContainerStyle={{ paddingBottom: bottomInset }}
    />
  );
}

import { type NotificationFieldsFragment, useNotificationsList } from '@sentio/api-client';
import { useRelativeTime, useTranslation } from '@sentio/i18n';
import {
  BellIcon,
  Button,
  EmptyState,
  ErrorState,
  NotificationItem,
  PostCardSkeleton,
  Spinner,
  XStack,
  YStack,
} from '@sentio/ui';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ScreenHeader';
import { UserAvatar } from '@/components/UserAvatar';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const relative = useRelativeTime();
  const router = useRouter();
  const list = useNotificationsList();
  const unread = list.items.filter((n) => !n.readAt).length;

  const text = (n: NotificationFieldsFragment) => {
    const name = n.actor?.displayName ?? '—';
    if (n.type === 'share') {
      return n.post
        ? t('notifications.share', { name, title: n.post.title })
        : t('notifications.shareNoPost', { name });
    }
    return name;
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScreenHeader title={t('notifications.title')} />
      {unread > 0 ? (
        <XStack justifyContent="flex-end" paddingHorizontal="$3">
          <Button tone="ghost" loading={list.marking} onPress={() => void list.markRead()}>
            {t('notifications.markAllRead')}
          </Button>
        </XStack>
      ) : null}
      <FlashList
        data={list.items}
        keyExtractor={(n) => n.id}
        renderItem={({ item: n }) => (
          <NotificationItem
            avatar={
              <UserAvatar name={n.actor?.displayName ?? '?'} avatar={n.actor?.avatar} size={40} />
            }
            text={text(n)}
            message={n.message}
            timeLabel={relative(n.createdAt)}
            unread={!n.readAt}
            onPress={() => {
              if (!n.readAt) void list.markRead([n.id]);
              if (n.post) router.push(`/post/${n.post.id}`);
            }}
          />
        )}
        ListEmptyComponent={
          list.initialLoading ? (
            <PostCardSkeleton />
          ) : list.error ? (
            <ErrorState
              message={t('feed.error')}
              retryLabel={t('feed.retry')}
              onRetry={() => void list.refresh()}
            />
          ) : (
            <EmptyState icon={BellIcon} title={t('notifications.empty')} />
          )
        }
        ListFooterComponent={
          list.loadingMore ? (
            <YStack alignItems="center" padding="$3">
              <Spinner />
            </YStack>
          ) : null
        }
        onEndReached={() => {
          if (list.hasMore && !list.loadingMore) void list.loadMore();
        }}
        onEndReachedThreshold={0.5}
        refreshing={list.refreshing}
        onRefresh={() => void list.refresh()}
      />
    </SafeAreaView>
  );
}

'use client';

import { type NotificationFieldsFragment, useNotificationsList } from '@sentio/api-client';
import { useRelativeTime, useTranslation } from '@sentio/i18n';
import {
  Button,
  EmptyState,
  ErrorState,
  H3,
  NotificationItem,
  PostCardSkeleton,
  Spinner,
  XStack,
  YStack,
  BellIcon,
} from '@sentio/ui';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { UserAvatar } from '@/components/UserAvatar';

function useNotificationText() {
  const { t } = useTranslation();
  return (n: NotificationFieldsFragment) => {
    const name = n.actor?.displayName ?? '—';
    if (n.type === 'share') {
      return n.post
        ? t('notifications.share', { name, title: n.post.title })
        : t('notifications.shareNoPost', { name });
    }
    return name;
  };
}

export default function NotificationsPage() {
  const { t } = useTranslation();
  const relative = useRelativeTime();
  const text = useNotificationText();
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const list = useNotificationsList();
  const sentinel = useRef<HTMLDivElement>(null);
  const { hasMore, loadMore } = list;
  const unread = list.items.filter((n) => !n.readAt).length;

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && hasMore) void loadMore();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <YStack width="100%" maxWidth={640} alignSelf="center">
      <XStack padding="$4" alignItems="center" justifyContent="space-between" gap="$2">
        <H3>{t('notifications.title')}</H3>
        {unread > 0 ? (
          <Button tone="ghost" loading={list.marking} onPress={() => void list.markRead()}>
            {t('notifications.markAllRead')}
          </Button>
        ) : null}
      </XStack>

      {list.initialLoading ? (
        <PostCardSkeleton />
      ) : list.error && list.items.length === 0 ? (
        <ErrorState
          message={t('feed.error')}
          retryLabel={t('feed.retry')}
          onRetry={() => void list.refresh()}
        />
      ) : list.items.length === 0 ? (
        <EmptyState icon={BellIcon} title={t('notifications.empty')} />
      ) : (
        list.items.map((n) => (
          <NotificationItem
            key={n.id}
            avatar={
              <UserAvatar name={n.actor?.displayName ?? '?'} avatar={n.actor?.avatar} size={40} />
            }
            text={text(n)}
            message={n.message}
            timeLabel={relative(n.createdAt)}
            unread={!n.readAt}
            onPress={() => {
              if (!n.readAt) void list.markRead([n.id]);
              if (n.post) router.push(`/${locale}/post/${n.post.id}`);
            }}
          />
        ))
      )}
      <div ref={sentinel} />
      {list.loadingMore ? (
        <YStack alignItems="center" padding="$3">
          <Spinner />
        </YStack>
      ) : null}
    </YStack>
  );
}

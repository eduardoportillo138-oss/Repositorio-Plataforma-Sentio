'use client';

import { useCallback } from 'react';
import {
  NotificationsDocument,
  UnreadNotificationsCountDocument,
  useMarkNotificationsReadMutation,
  useNotificationsQuery,
  useUnreadNotificationsCountQuery,
} from './generated/graphql';
import { useRealtimeEvent } from './realtime-provider';
import { useConnection } from './use-connection';

/** Contador de no leídas. Se actualiza al llegar `notification:created` por Socket.IO. */
export function useUnreadNotifications(enabled = true) {
  const { data, refetch } = useUnreadNotificationsCountQuery({
    skip: !enabled,
    fetchPolicy: 'cache-and-network',
  });
  useRealtimeEvent('notification:created', () => {
    if (enabled) void refetch();
  });
  return data?.unreadNotificationsCount ?? 0;
}

/** Lista de notificaciones con scroll infinito y "marcar todo como leído". */
export function useNotificationsList() {
  const query = useNotificationsQuery({ notifyOnNetworkStatusChange: true });
  const feed = useConnection(query, (d) => d.notifications);
  const [mutate, { loading: marking }] = useMarkNotificationsReadMutation();

  useRealtimeEvent('notification:created', () => {
    void feed.refresh();
  });

  const markRead = useCallback(
    async (ids?: string[]) => {
      await mutate({
        variables: { ids: ids ?? null },
        refetchQueries: [UnreadNotificationsCountDocument, NotificationsDocument],
      });
    },
    [mutate],
  );

  return { ...feed, markRead, marking };
}

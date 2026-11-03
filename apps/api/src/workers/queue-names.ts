export const QueueName = {
  NOTIFICATIONS: 'notifications',
  FEED_FANOUT: 'feed-fanout',
  MEDIA: 'media',
} as const;

export type QueueName = (typeof QueueName)[keyof typeof QueueName];

export interface NotificationJob {
  userId: string;
  type: string;
  actorId: string | null;
}

export interface FeedFanoutJob {
  postId: string;
  authorId: string;
}

export interface MediaJob {
  mediaId: string;
}

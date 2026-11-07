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

/** Nombres de job de la cola `media`. */
export const MediaJobName = {
  /** Genera las variantes de una foto de perfil subida. */
  PROCESS_AVATAR: 'process-avatar',
  /** Borra objetos del almacenamiento (fotos reemplazadas o quitadas). */
  DELETE_OBJECTS: 'delete-objects',
} as const;

export interface ProcessAvatarJob {
  mediaId: string;
}

export interface DeleteObjectsJob {
  keys: string[];
}

export type MediaJob = ProcessAvatarJob | DeleteObjectsJob;

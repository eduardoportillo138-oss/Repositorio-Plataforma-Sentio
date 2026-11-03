/**
 * Contrato de eventos Socket.IO compartido por la API (servidor) y los clientes web/móvil.
 * Los datos de dominio viajan por GraphQL; aquí solo van señales ligeras en tiempo real.
 */

export const REALTIME_NAMESPACE = '/realtime';

export const rooms = {
  user: (userId: string) => `user:${userId}`,
  group: (groupId: string) => `group:${groupId}`,
  conversation: (conversationId: string) => `conversation:${conversationId}`,
} as const;

export interface NotificationCreatedEvent {
  id: string;
  type: string;
  createdAt: string;
}

export interface ChatMessageEvent {
  conversationId: string;
  messageId: string;
  senderId: string;
  createdAt: string;
}

export interface TypingEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface FeedNewItemsEvent {
  count: number;
}

export interface ServerToClientEvents {
  'notification:created': (event: NotificationCreatedEvent) => void;
  'chat:message': (event: ChatMessageEvent) => void;
  'chat:typing': (event: TypingEvent) => void;
  'feed:new-items': (event: FeedNewItemsEvent) => void;
  'session:revoked': () => void;
}

export type Ack<T = undefined> = (
  response: { ok: true; data?: T } | { ok: false; error: string },
) => void;

export interface ClientToServerEvents {
  'chat:join': (payload: { conversationId: string }, ack: Ack) => void;
  'chat:leave': (payload: { conversationId: string }) => void;
  'chat:typing': (payload: { conversationId: string; isTyping: boolean }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

/** Datos que el servidor adjunta al socket tras autenticar el handshake. */
export interface SocketData {
  userId: string;
  sessionId: string;
}

/** Payload de `handshake.auth` que envían los clientes. */
export interface HandshakeAuth {
  token: string;
}

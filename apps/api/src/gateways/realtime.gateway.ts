import { Logger, type OnModuleDestroy } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayConnection,
  type OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  type ClientToServerEvents,
  type InterServerEvents,
  REALTIME_NAMESPACE,
  rooms,
  type ServerToClientEvents,
  type SocketData,
} from '@sentio/realtime/events';
import { type Subscription } from 'rxjs';
import { type Namespace, type Socket } from 'socket.io';
import { SessionEvents, type SessionsRevokedEvent } from '../modules/auth/session-events';
import { SessionsService } from '../modules/auth/sessions.service';
import { TokensService } from '../modules/auth/tokens.service';

type AppNamespace = Namespace<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

/**
 * Gateway Socket.IO. Autentica el handshake con el mismo access token JWT que GraphQL
 * y une cada socket a la sala personal `user:<id>`. CORS lo configura SocketIoAdapter.
 * Al revocarse una sesión avisa con `session:revoked` y desconecta los sockets de esa sesión.
 */
@WebSocketGateway({ namespace: REALTIME_NAMESPACE })
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnModuleDestroy {
  private readonly logger = new Logger(RealtimeGateway.name);
  private revokedSubscription?: Subscription;

  /** Con `namespace`, Nest inyecta el Namespace, no el Server raíz. */
  @WebSocketServer()
  server!: AppNamespace;

  constructor(
    private readonly tokens: TokensService,
    private readonly sessions: SessionsService,
    private readonly sessionEvents: SessionEvents,
  ) {}

  afterInit(): void {
    this.revokedSubscription = this.sessionEvents.revoked$.subscribe((event) => {
      this.onSessionsRevoked(event).catch((error: unknown) =>
        this.logger.error(`No se pudo notificar la revocación de sesión: ${String(error)}`),
      );
    });
  }

  onModuleDestroy(): void {
    this.revokedSubscription?.unsubscribe();
  }

  async handleConnection(client: AppSocket): Promise<void> {
    const token: unknown = (client.handshake.auth as Record<string, unknown>).token;
    const user = typeof token === 'string' ? await this.tokens.verifyAccessToken(token) : null;
    if (!user || !(await this.sessions.isActive(user.sessionId))) {
      client.disconnect(true);
      return;
    }
    client.data = { userId: user.userId, sessionId: user.sessionId };
    await client.join(rooms.user(user.userId));
    this.logger.debug(`Socket ${client.id} conectado (usuario ${user.userId})`);
  }

  /** Emite a todos los sockets de un usuario. Lo usarán notificaciones y chat. */
  emitToUser<E extends keyof ServerToClientEvents>(
    userId: string,
    event: E,
    ...args: Parameters<ServerToClientEvents[E]>
  ): void {
    this.server.to(rooms.user(userId)).emit(event, ...args);
  }

  /** Avisa a la sala del usuario y cierra los sockets autenticados con las sesiones revocadas. */
  async onSessionsRevoked({ userId, sessionIds, reason }: SessionsRevokedEvent): Promise<void> {
    const room = rooms.user(userId);
    for (const sessionId of sessionIds) {
      this.server.to(room).emit('session:revoked', { sessionId, reason });
    }
    const revoked = new Set(sessionIds);
    // Solo sockets de esta instancia; con varias instancias hará falta el adaptador Redis.
    const sockets = await this.server.in(room).fetchSockets();
    for (const socket of sockets) {
      if (revoked.has(socket.data.sessionId)) socket.disconnect(true);
    }
  }

  @SubscribeMessage('chat:leave')
  async onChatLeave(
    @ConnectedSocket() client: AppSocket,
    @MessageBody() payload: { conversationId: string },
  ): Promise<void> {
    await client.leave(rooms.conversation(payload.conversationId));
  }

  // TODO(Etapa 1): 'chat:join' validando participación en la conversación y 'chat:typing'.
}

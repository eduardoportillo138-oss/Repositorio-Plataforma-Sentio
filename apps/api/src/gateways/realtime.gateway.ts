import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayConnection,
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
import { type Server, type Socket } from 'socket.io';
import { SessionsService } from '../modules/auth/sessions.service';
import { TokensService } from '../modules/auth/tokens.service';

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

/**
 * Gateway Socket.IO. Autentica el handshake con el mismo access token JWT que GraphQL
 * y une cada socket a la sala personal `user:<id>`. CORS lo configura SocketIoAdapter.
 */
@WebSocketGateway({ namespace: REALTIME_NAMESPACE })
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: AppServer;

  constructor(
    private readonly tokens: TokensService,
    private readonly sessions: SessionsService,
  ) {}

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

  @SubscribeMessage('chat:leave')
  async onChatLeave(
    @ConnectedSocket() client: AppSocket,
    @MessageBody() payload: { conversationId: string },
  ): Promise<void> {
    await client.leave(rooms.conversation(payload.conversationId));
  }

  // TODO(Etapa 1): 'chat:join' validando participación en la conversación y 'chat:typing'.
}

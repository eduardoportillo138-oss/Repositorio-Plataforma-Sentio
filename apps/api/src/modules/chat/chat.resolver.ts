import { Resolver } from '@nestjs/graphql';

/**
 * Esqueleto (Etapa 0). Las queries y mutaciones se agregan en la Etapa 1:
 * conversaciones 1:1 y de grupo, envío de mensajes y eventos Socket.IO (chat:message).
 */
@Resolver()
export class ChatResolver {}

import { Resolver } from '@nestjs/graphql';

/**
 * Esqueleto (Etapa 0). Las queries y mutaciones se agregan en la Etapa 1:
 * crear notificaciones desde la cola, marcarlas como leídas y emitir notification:created.
 */
@Resolver()
export class NotificationsResolver {}

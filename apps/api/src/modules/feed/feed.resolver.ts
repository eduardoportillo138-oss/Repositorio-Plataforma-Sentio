import { Resolver } from '@nestjs/graphql';

/**
 * Esqueleto (Etapa 0). Las queries y mutaciones se agregan en la Etapa 1:
 * feed "Siguiendo" con fan-out on write (worker feed-fanout) y paginación Relay.
 */
@Resolver()
export class FeedResolver {}

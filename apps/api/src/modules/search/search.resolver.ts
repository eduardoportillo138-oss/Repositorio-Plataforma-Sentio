import { Resolver } from '@nestjs/graphql';

/**
 * Esqueleto (Etapa 0). Las queries y mutaciones se agregan en la Etapa 1:
 * búsqueda de usuarios, grupos y posts con índices de Atlas Search; historial reciente.
 */
@Resolver()
export class SearchResolver {}

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'auth:isPublic';

/** Marca un resolver/handler como accesible sin autenticación. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

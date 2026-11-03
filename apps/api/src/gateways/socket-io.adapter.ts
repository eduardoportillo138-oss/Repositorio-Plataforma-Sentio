import { type INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { type ServerOptions } from 'socket.io';

/** Adaptador Socket.IO con CORS tomado de la configuración (CORS_ORIGINS). */
export class SocketIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly origins: string[],
  ) {
    super(app);
  }

  override createIOServer(port: number, options?: ServerOptions): unknown {
    return super.createIOServer(port, {
      ...options,
      cors: { origin: this.origins, credentials: true },
    });
  }

  // TODO(Etapa 1): adaptador Redis (@socket.io/redis-adapter) para escalar a varias instancias.
}

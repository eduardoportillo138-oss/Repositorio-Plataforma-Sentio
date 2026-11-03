import { type INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppConfigService } from './config/app-config.service';
import { SocketIoAdapter } from './gateways/socket-io.adapter';

/** Configuración común a main.ts y a las pruebas de integración. */
export function configureApp(app: INestApplication): INestApplication {
  const config = app.get(AppConfigService);
  const origins = config.get('CORS_ORIGINS');

  app.use(cookieParser());
  app.enableCors({ origin: origins, credentials: true });
  app.useWebSocketAdapter(new SocketIoAdapter(app, origins));
  app.enableShutdownHooks();
  return app;
}

import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap';
import { AppConfigService } from './config/app-config.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  // Detrás de un proxy (Render, Fly, Nginx) para que req.ip sea la IP real del cliente.
  app.set('trust proxy', 1);
  configureApp(app);

  const config = app.get(AppConfigService);
  const port = config.get('API_PORT');
  await app.listen(port);
  Logger.log(`API lista en http://localhost:${port}/graphql`, 'Bootstrap');
}

void bootstrap();

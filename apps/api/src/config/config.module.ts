import { join } from 'node:path';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfigService } from './app-config.service';
import { validateEnv } from './env.schema';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // .env vive en la raíz del monorepo; un .env local en apps/api tiene prioridad.
      envFilePath: [
        join(__dirname, '..', '..', '.env'),
        join(__dirname, '..', '..', '..', '..', '.env'),
      ],
      validate: validateEnv,
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}

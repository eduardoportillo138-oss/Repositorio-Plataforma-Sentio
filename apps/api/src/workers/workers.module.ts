import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { FeedFanoutProcessor } from './feed-fanout.processor';
import { NotificationsProcessor } from './notifications.processor';
import { QueueName } from './queue-names';

/**
 * Colas BullMQ sobre Redis. Se desactiva con QUEUES_ENABLED=false (p. ej. en pruebas).
 * En producción los processors pueden correr en un proceso aparte con el mismo módulo.
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        connection: { url: config.get('REDIS_URL'), maxRetriesPerRequest: null },
        defaultJobOptions: {
          attempts: 5,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: 1000,
          removeOnFail: 5000,
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QueueName.NOTIFICATIONS },
      { name: QueueName.FEED_FANOUT },
      { name: QueueName.MEDIA },
    ),
  ],
  providers: [NotificationsProcessor, FeedFanoutProcessor],
  exports: [BullModule],
})
export class WorkersModule {}

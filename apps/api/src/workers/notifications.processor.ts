import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { type Job } from 'bullmq';
import { type NotificationJob, QueueName } from './queue-names';

@Processor(QueueName.NOTIFICATIONS)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  process(job: Job<NotificationJob>): Promise<void> {
    // TODO(Etapa 1): persistir la notificación y emitir 'notification:created' por el gateway.
    this.logger.debug(`Job ${job.id ?? '?'} (${job.data.type}) para ${job.data.userId}`);
    return Promise.resolve();
  }
}

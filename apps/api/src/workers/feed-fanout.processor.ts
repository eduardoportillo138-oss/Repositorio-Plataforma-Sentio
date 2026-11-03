import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { type Job } from 'bullmq';
import { type FeedFanoutJob, QueueName } from './queue-names';

@Processor(QueueName.FEED_FANOUT)
export class FeedFanoutProcessor extends WorkerHost {
  private readonly logger = new Logger(FeedFanoutProcessor.name);

  process(job: Job<FeedFanoutJob>): Promise<void> {
    // TODO(Etapa 1): insertar feed_items para cada seguidor del autor, en lotes.
    this.logger.debug(`Fan-out del post ${job.data.postId}`);
    return Promise.resolve();
  }
}

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { type Job } from 'bullmq';
import { PostsService } from '../modules/posts/posts.service';
import { PostsJobName, QueueName, type SyncAuthorJob } from './queue-names';

/** Worker de la cola `posts`: actualiza la copia del autor en sus publicaciones. */
@Processor(QueueName.POSTS)
export class PostsProcessor extends WorkerHost {
  private readonly logger = new Logger(PostsProcessor.name);

  constructor(private readonly posts: PostsService) {
    super();
  }

  async process(job: Job<SyncAuthorJob>): Promise<void> {
    if (job.name !== PostsJobName.SYNC_AUTHOR) {
      this.logger.warn(`Job desconocido en la cola posts: ${job.name}`);
      return;
    }
    const updated = await this.posts.syncAuthor(job.data.userId);
    this.logger.debug(`Autor ${job.data.userId} actualizado en ${updated} publicaciones`);
  }
}

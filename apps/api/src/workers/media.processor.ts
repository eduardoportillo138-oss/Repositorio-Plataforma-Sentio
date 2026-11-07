import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { type Job } from 'bullmq';
import { AvatarProcessorService } from '../modules/media/avatar-processor.service';
import { OBJECT_STORAGE, type ObjectStorage } from '../modules/media/storage/object-storage';
import {
  type DeleteObjectsJob,
  MediaJobName,
  type ProcessAvatarJob,
  QueueName,
} from './queue-names';

/** Worker de la cola `media`: variantes de fotos de perfil y borrado de objetos. */
@Processor(QueueName.MEDIA)
export class MediaProcessor extends WorkerHost {
  private readonly logger = new Logger(MediaProcessor.name);

  constructor(
    private readonly avatars: AvatarProcessorService,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
  ) {
    super();
  }

  async process(job: Job<ProcessAvatarJob | DeleteObjectsJob>): Promise<void> {
    switch (job.name) {
      case MediaJobName.PROCESS_AVATAR:
        await this.avatars.process((job.data as ProcessAvatarJob).mediaId);
        return;
      case MediaJobName.DELETE_OBJECTS:
        await this.storage.delete((job.data as DeleteObjectsJob).keys);
        return;
      default:
        this.logger.warn(`Job desconocido en la cola media: ${job.name}`);
    }
  }
}

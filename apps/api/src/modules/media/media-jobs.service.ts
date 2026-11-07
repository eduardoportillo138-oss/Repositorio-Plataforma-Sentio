import { getQueueToken } from '@nestjs/bullmq';
import { forwardRef, Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { type Queue } from 'bullmq';
import { AppConfigService } from '../../config/app-config.service';
import {
  type DeleteObjectsJob,
  MediaJobName,
  type ProcessAvatarJob,
  QueueName,
} from '../../workers/queue-names';
// Dependencia circular (el procesador también usa este servicio): se resuelve con forwardRef.
import { AvatarProcessorService } from './avatar-processor.service';
import { type MediaAsset } from './schemas/media-asset.schema';
import { OBJECT_STORAGE, type ObjectStorage } from './storage/object-storage';

/**
 * Despacha el trabajo de medios: a la cola `media` (BullMQ) si QUEUES_ENABLED=true, o en línea
 * en el mismo proceso si está desactivada (pruebas y desarrollo sin Redis).
 */
@Injectable()
export class MediaJobsService implements OnModuleInit {
  private readonly logger = new Logger(MediaJobsService.name);
  private queue: Queue<ProcessAvatarJob | DeleteObjectsJob> | null = null;
  private readonly pending = new Set<Promise<void>>();

  constructor(
    private readonly config: AppConfigService,
    private readonly moduleRef: ModuleRef,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    @Inject(forwardRef(() => AvatarProcessorService))
    private readonly processor: AvatarProcessorService,
  ) {}

  onModuleInit(): void {
    if (this.config.get('QUEUES_ENABLED')) {
      this.queue = this.moduleRef.get(getQueueToken(QueueName.MEDIA), { strict: false });
    }
  }

  get inline(): boolean {
    return this.queue === null;
  }

  /**
   * Procesa una foto de perfil confirmada. En línea devuelve el asset ya procesado;
   * con cola devuelve `null` y el resultado llega por Socket.IO (`media:ready`).
   */
  async processAvatar(mediaId: string): Promise<MediaAsset | null> {
    if (this.queue) {
      await this.queue.add(
        MediaJobName.PROCESS_AVATAR,
        { mediaId },
        { jobId: `avatar-${mediaId}` },
      );
      return null;
    }
    return this.processor.process(mediaId);
  }

  /** Borra objetos en segundo plano; un fallo se registra pero no afecta al usuario. */
  async deleteObjects(keys: readonly string[]): Promise<void> {
    if (keys.length === 0) return;
    if (this.queue) {
      await this.queue.add(MediaJobName.DELETE_OBJECTS, { keys: [...keys] });
      return;
    }
    const task = new Promise<void>((resolve) => {
      setImmediate(() => {
        this.storage
          .delete(keys)
          .catch((error: unknown) =>
            this.logger.warn(`No se pudieron borrar ${keys.length} objetos: ${String(error)}`),
          )
          .finally(() => {
            this.pending.delete(task);
            resolve();
          });
      });
    });
    this.pending.add(task);
  }

  /** Espera los borrados en curso (modo en línea). Útil en pruebas y al apagar. */
  async drain(): Promise<void> {
    await Promise.all([...this.pending]);
  }
}

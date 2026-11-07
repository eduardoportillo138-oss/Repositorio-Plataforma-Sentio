import { getQueueToken } from '@nestjs/bullmq';
import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { type Queue } from 'bullmq';
import { type Subscription } from 'rxjs';
import { AppConfigService } from '../../config/app-config.service';
import { PostsJobName, QueueName, type SyncAuthorJob } from '../../workers/queue-names';
import { UserEvents } from '../users/user-events';
import { PostsService } from './posts.service';

/**
 * Mantiene al día la copia del autor (`post.author`) cuando cambia su nombre o su foto.
 * Con colas encola `sync-author` en la cola `posts`; sin colas lo hace en segundo plano.
 */
@Injectable()
export class AuthorSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuthorSyncService.name);
  private queue: Queue<SyncAuthorJob> | null = null;
  private subscription?: Subscription;
  private readonly pending = new Set<Promise<void>>();

  constructor(
    private readonly config: AppConfigService,
    private readonly moduleRef: ModuleRef,
    private readonly events: UserEvents,
    private readonly posts: PostsService,
  ) {}

  onModuleInit(): void {
    if (this.config.get('QUEUES_ENABLED')) {
      this.queue = this.moduleRef.get(getQueueToken(QueueName.POSTS), { strict: false });
    }
    this.subscription = this.events.profileChanged$.subscribe(({ userId }) => {
      void this.schedule(userId);
    });
  }

  onModuleDestroy(): void {
    this.subscription?.unsubscribe();
  }

  async schedule(userId: string): Promise<void> {
    if (this.queue) {
      try {
        await this.queue.add(PostsJobName.SYNC_AUTHOR, { userId });
      } catch (error) {
        this.logger.warn(`No se pudo encolar sync-author de ${userId}: ${String(error)}`);
      }
      return;
    }
    const task = new Promise<void>((resolve) => {
      setImmediate(() => {
        this.posts
          .syncAuthor(userId)
          .catch((error: unknown) =>
            this.logger.warn(`No se pudo actualizar el autor ${userId}: ${String(error)}`),
          )
          .finally(() => {
            this.pending.delete(task);
            resolve();
          });
      });
    });
    this.pending.add(task);
  }

  /** Espera las sincronizaciones en curso (modo en línea). */
  async drain(): Promise<void> {
    await Promise.all([...this.pending]);
  }
}

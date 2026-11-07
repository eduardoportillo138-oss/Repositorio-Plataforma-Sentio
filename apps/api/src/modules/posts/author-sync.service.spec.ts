import { getQueueToken } from '@nestjs/bullmq';
import { type ModuleRef } from '@nestjs/core';
import { type AppConfigService } from '../../config/app-config.service';
import { PostsJobName, QueueName } from '../../workers/queue-names';
import { UserEvents } from '../users/user-events';
import { AuthorSyncService } from './author-sync.service';
import { type PostsService } from './posts.service';

function setup(queuesEnabled: boolean) {
  const add = jest.fn().mockResolvedValue(undefined);
  const moduleRefGet = jest.fn().mockReturnValue({ add });
  const syncAuthor = jest.fn().mockResolvedValue(2);
  const events = new UserEvents();
  const service = new AuthorSyncService(
    { get: () => queuesEnabled } as unknown as AppConfigService,
    { get: moduleRefGet } as unknown as ModuleRef,
    events,
    { syncAuthor } as unknown as PostsService,
  );
  service.onModuleInit();
  return { service, events, add, moduleRefGet, syncAuthor };
}

describe('AuthorSyncService', () => {
  it('con colas encola sync-author al cambiar el perfil', async () => {
    const { service, events, add, moduleRefGet, syncAuthor } = setup(true);
    expect(moduleRefGet).toHaveBeenCalledWith(getQueueToken(QueueName.POSTS), { strict: false });
    events.profileChanged('u1');
    await new Promise((r) => setImmediate(r));
    expect(add).toHaveBeenCalledWith(PostsJobName.SYNC_AUTHOR, { userId: 'u1' });
    expect(syncAuthor).not.toHaveBeenCalled();
    service.onModuleDestroy();
  });

  it('un fallo al encolar se registra y no se propaga', async () => {
    const { service, add } = setup(true);
    add.mockRejectedValueOnce(new Error('redis caído'));
    await expect(service.schedule('u1')).resolves.toBeUndefined();
  });

  it('sin colas sincroniza en segundo plano', async () => {
    const { service, events, syncAuthor } = setup(false);
    events.profileChanged('u2');
    expect(syncAuthor).not.toHaveBeenCalled();
    await service.drain();
    expect(syncAuthor).toHaveBeenCalledWith('u2');
  });

  it('un fallo al sincronizar en línea no rompe nada', async () => {
    const { service, syncAuthor } = setup(false);
    syncAuthor.mockRejectedValueOnce(new Error('mongo'));
    await service.schedule('u3');
    await expect(service.drain()).resolves.toBeUndefined();
  });

  it('deja de escuchar al destruirse', async () => {
    const { service, events, syncAuthor } = setup(false);
    service.onModuleDestroy();
    events.profileChanged('u4');
    await service.drain();
    expect(syncAuthor).not.toHaveBeenCalled();
  });
});

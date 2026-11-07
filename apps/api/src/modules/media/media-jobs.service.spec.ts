import { getQueueToken } from '@nestjs/bullmq';
import { type ModuleRef } from '@nestjs/core';
import { type AppConfigService } from '../../config/app-config.service';
import { MediaJobName, QueueName } from '../../workers/queue-names';
import { type AvatarProcessorService } from './avatar-processor.service';
import { MediaJobsService } from './media-jobs.service';
import { type ObjectStorage } from './storage/object-storage';

function setup(queuesEnabled: boolean) {
  const queue = { add: jest.fn().mockResolvedValue(undefined) };
  const moduleRefGet = jest.fn().mockReturnValue(queue);
  const moduleRef = { get: moduleRefGet } as unknown as ModuleRef;
  const config = { get: jest.fn().mockReturnValue(queuesEnabled) } as unknown as AppConfigService;
  const deleteObjects = jest.fn().mockResolvedValue(undefined);
  const processAvatar = jest.fn().mockResolvedValue({ status: 'ready' });
  const service = new MediaJobsService(
    config,
    moduleRef,
    { delete: deleteObjects } as unknown as ObjectStorage,
    { process: processAvatar } as unknown as AvatarProcessorService,
  );
  service.onModuleInit();
  return { service, queue, moduleRefGet, deleteObjects, processAvatar };
}

describe('MediaJobsService', () => {
  describe('con colas (BullMQ)', () => {
    it('obtiene la cola media del contenedor', () => {
      const { service, moduleRefGet } = setup(true);
      expect(service.inline).toBe(false);
      expect(moduleRefGet).toHaveBeenCalledWith(getQueueToken(QueueName.MEDIA), {
        strict: false,
      });
    });

    it('encola el procesamiento con jobId estable (idempotente) y no procesa en línea', async () => {
      const { service, queue, processAvatar } = setup(true);
      await expect(service.processAvatar('abc')).resolves.toBeNull();
      expect(queue.add).toHaveBeenCalledWith(
        MediaJobName.PROCESS_AVATAR,
        { mediaId: 'abc' },
        { jobId: 'avatar-abc' },
      );
      expect(processAvatar).not.toHaveBeenCalled();
    });

    it('encola el borrado de objetos', async () => {
      const { service, queue, deleteObjects } = setup(true);
      await service.deleteObjects(['a', 'b']);
      expect(queue.add).toHaveBeenCalledWith(MediaJobName.DELETE_OBJECTS, { keys: ['a', 'b'] });
      expect(deleteObjects).not.toHaveBeenCalled();
    });
  });

  describe('en línea (QUEUES_ENABLED=false)', () => {
    it('procesa en el mismo proceso y devuelve el asset', async () => {
      const { service, processAvatar } = setup(false);
      expect(service.inline).toBe(true);
      await expect(service.processAvatar('abc')).resolves.toEqual({ status: 'ready' });
      expect(processAvatar).toHaveBeenCalledWith('abc');
    });

    it('borra en segundo plano sin bloquear', async () => {
      const { service, deleteObjects } = setup(false);
      await service.deleteObjects(['a']);
      expect(deleteObjects).not.toHaveBeenCalled();
      await service.drain();
      expect(deleteObjects).toHaveBeenCalledWith(['a']);
    });

    it('un fallo al borrar se registra y no se propaga', async () => {
      const { service, deleteObjects } = setup(false);
      deleteObjects.mockRejectedValueOnce(new Error('caído'));
      await service.deleteObjects(['a']);
      await expect(service.drain()).resolves.toBeUndefined();
    });

    it('no hace nada sin claves', async () => {
      const { service, deleteObjects } = setup(false);
      await service.deleteObjects([]);
      await service.drain();
      expect(deleteObjects).not.toHaveBeenCalled();
    });
  });
});

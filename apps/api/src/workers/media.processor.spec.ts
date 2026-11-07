import { type Job } from 'bullmq';
import { type AvatarProcessorService } from '../modules/media/avatar-processor.service';
import { type ObjectStorage } from '../modules/media/storage/object-storage';
import { MediaProcessor } from './media.processor';
import { MediaJobName } from './queue-names';

describe('MediaProcessor', () => {
  const processAvatar = jest.fn();
  const deleteObjects = jest.fn();
  const processor = new MediaProcessor(
    { process: processAvatar } as unknown as AvatarProcessorService,
    { delete: deleteObjects } as unknown as ObjectStorage,
  );

  const job = (name: string, data: unknown) => ({ name, data }) as Job<never>;

  it('procesa fotos de perfil', async () => {
    await processor.process(job(MediaJobName.PROCESS_AVATAR, { mediaId: 'm1' }));
    expect(processAvatar).toHaveBeenCalledWith('m1');
  });

  it('borra objetos', async () => {
    await processor.process(job(MediaJobName.DELETE_OBJECTS, { keys: ['a'] }));
    expect(deleteObjects).toHaveBeenCalledWith(['a']);
  });

  it('ignora jobs desconocidos', async () => {
    await expect(processor.process(job('otro', {}))).resolves.toBeUndefined();
  });
});

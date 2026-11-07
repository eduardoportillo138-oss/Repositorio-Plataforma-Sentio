import { type Job } from 'bullmq';
import { type PostsService } from '../modules/posts/posts.service';
import { PostsProcessor } from './posts.processor';
import { PostsJobName, type SyncAuthorJob } from './queue-names';

describe('PostsProcessor', () => {
  const syncAuthor = jest.fn().mockResolvedValue(3);
  const processor = new PostsProcessor({ syncAuthor } as unknown as PostsService);
  const job = (name: string) => ({ name, data: { userId: 'u1' } }) as Job<SyncAuthorJob>;

  it('sincroniza el autor', async () => {
    await processor.process(job(PostsJobName.SYNC_AUTHOR));
    expect(syncAuthor).toHaveBeenCalledWith('u1');
  });

  it('ignora jobs desconocidos', async () => {
    syncAuthor.mockClear();
    await processor.process(job('otro'));
    expect(syncAuthor).not.toHaveBeenCalled();
  });
});

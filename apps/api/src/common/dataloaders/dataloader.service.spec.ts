import { Types } from 'mongoose';
import { type PostsService } from '../../modules/posts/posts.service';
import { type ReactionsService } from '../../modules/reactions/reactions.service';
import { type UsersService } from '../../modules/users/users.service';
import { type AppRequest } from '../graphql/context';
import { DataloaderService } from './dataloader.service';

function setup() {
  const likedPostIds = jest.fn((_userId: string, ids: readonly string[]) =>
    Promise.resolve(new Set(ids.filter((_, i) => i % 2 === 0))),
  );
  const postA = { _id: new Types.ObjectId() };
  const findPosts = jest.fn().mockResolvedValue([postA]);
  const findUsers = jest.fn().mockResolvedValue([]);
  const service = new DataloaderService(
    { findByIds: findUsers } as unknown as UsersService,
    { findByIds: findPosts } as unknown as PostsService,
    { likedPostIds } as unknown as ReactionsService,
  );
  return { service, likedPostIds, findPosts, findUsers, postA };
}

describe('DataloaderService', () => {
  it('viewerLikedPostIds resuelve toda una página con una sola consulta', async () => {
    const { service, likedPostIds } = setup();
    const req = { user: { userId: 'u1', sessionId: 's1' } } as AppRequest;
    const loaders = service.createLoaders(req);
    const results = await Promise.all(
      ['p0', 'p1', 'p2', 'p3'].map((id) => loaders.viewerLikedPostIds.load(id)),
    );
    expect(results).toEqual([true, false, true, false]);
    expect(likedPostIds).toHaveBeenCalledTimes(1);
    expect(likedPostIds).toHaveBeenCalledWith('u1', ['p0', 'p1', 'p2', 'p3']);
  });

  it('lee el usuario al ejecutar el lote (el guard lo adjunta después de crear el contexto)', async () => {
    const { service, likedPostIds } = setup();
    const req = {} as AppRequest;
    const loaders = service.createLoaders(req);
    req.user = { userId: 'tarde', sessionId: 's' };
    await loaders.viewerLikedPostIds.load('p0');
    expect(likedPostIds).toHaveBeenCalledWith('tarde', ['p0']);
  });

  it('sin usuario todo es false y no consulta', async () => {
    const { service, likedPostIds } = setup();
    const loaders = service.createLoaders();
    await expect(loaders.viewerLikedPostIds.load('p0')).resolves.toBe(false);
    expect(likedPostIds).not.toHaveBeenCalled();
  });

  it('postById y userById devuelven null para ids que no existen', async () => {
    const { service, postA } = setup();
    const loaders = service.createLoaders();
    const id = postA._id.toHexString();
    await expect(loaders.postById.loadMany([id, 'otro'])).resolves.toEqual([postA, null]);
    await expect(loaders.userById.load('nadie')).resolves.toBeNull();
  });
});

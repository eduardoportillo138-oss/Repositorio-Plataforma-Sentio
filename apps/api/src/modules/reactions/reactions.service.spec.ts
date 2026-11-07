import { type Connection, type Model, mongo, Types } from 'mongoose';
import { type PostsService } from '../posts/posts.service';
import { ReactionsService } from './reactions.service';
import { type Reaction } from './schemas/reaction.schema';

const duplicateKey = () => new mongo.MongoServerError({ message: 'E11000', code: 11000 });

function setup(transaction: jest.Mock) {
  const post = { _id: new Types.ObjectId() };
  const find = jest.fn(() => ({ lean: () => ({ exec: () => Promise.resolve([]) }) }));
  const posts = {
    findVisible: jest.fn().mockResolvedValue(post),
    findById: jest.fn().mockResolvedValue(null),
  } as unknown as PostsService;
  const service = new ReactionsService(
    { find } as unknown as Model<Reaction>,
    { transaction } as unknown as Connection,
    posts,
  );
  return { service, post, find, posts };
}

const userId = new Types.ObjectId().toHexString();

describe('ReactionsService', () => {
  it('reintenta el toggle si otra petición insertó el like a la vez', async () => {
    const transaction = jest
      .fn()
      .mockRejectedValueOnce(duplicateKey())
      .mockResolvedValueOnce(false);
    const { service, post } = setup(transaction);
    await expect(service.toggleLike(userId, post._id.toHexString())).resolves.toMatchObject({
      liked: false,
      // Si no se puede releer, devuelve el post que ya tenía.
      post,
    });
    expect(transaction).toHaveBeenCalledTimes(2);
  });

  it('se rinde después de varios choques seguidos', async () => {
    const transaction = jest.fn().mockRejectedValue(duplicateKey());
    const { service, post } = setup(transaction);
    await expect(service.toggleLike(userId, post._id.toHexString())).rejects.toMatchObject({
      code: 11000,
    });
    expect(transaction).toHaveBeenCalledTimes(3);
  });

  it('propaga de inmediato otros errores', async () => {
    const transaction = jest.fn().mockRejectedValue(new Error('mongo caído'));
    const { service, post } = setup(transaction);
    await expect(service.toggleLike(userId, post._id.toHexString())).rejects.toThrow('mongo caído');
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it('likedPostIds no consulta sin ids válidos o con usuario inválido', async () => {
    const { service, find } = setup(jest.fn());
    await expect(service.likedPostIds(userId, ['x'])).resolves.toEqual(new Set());
    await expect(
      service.likedPostIds('nope', [new Types.ObjectId().toHexString()]),
    ).resolves.toEqual(new Set());
    expect(find).not.toHaveBeenCalled();
  });

  it('findById devuelve null con un id inválido', async () => {
    const { service } = setup(jest.fn());
    await expect(service.findById('nope')).resolves.toBeNull();
  });
});

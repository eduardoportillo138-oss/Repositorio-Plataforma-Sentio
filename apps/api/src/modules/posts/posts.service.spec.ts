import { ErrorCode } from '@sentio/core';
import { type Model, Types } from 'mongoose';
import { type UsersService } from '../users/users.service';
import { toPostModel } from './dto/post.dto';
import { PostsService } from './posts.service';
import { type Post } from './schemas/post.schema';

function setup(user: unknown = null) {
  const findById = jest.fn();
  const updateMany = jest.fn(() => ({ exec: () => Promise.resolve({ modifiedCount: 0 }) }));
  const users = {
    findById: jest.fn().mockResolvedValue(user),
    findByHandle: jest.fn().mockResolvedValue(user),
  } as unknown as UsersService;
  const service = new PostsService({ findById, updateMany } as unknown as Model<Post>, users);
  return { service, findById, updateMany };
}

describe('PostsService (casos límite)', () => {
  it('findById devuelve null con un id inválido sin consultar', async () => {
    const { service, findById } = setup();
    await expect(service.findById('nope')).resolves.toBeNull();
    expect(findById).not.toHaveBeenCalled();
  });

  it('create da NOT_FOUND si el autor no existe', async () => {
    const { service } = setup(null);
    await expect(
      service.create(new Types.ObjectId().toHexString(), {
        title: 'x',
        text: '',
        visibility: 'public',
      }),
    ).rejects.toMatchObject({ extensions: { code: ErrorCode.NOT_FOUND } });
  });

  it('syncAuthor no toca nada si el usuario ya no existe', async () => {
    const { service, updateMany } = setup(null);
    await expect(service.syncAuthor(new Types.ObjectId().toHexString())).resolves.toBe(0);
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('userPosts de una cuenta suspendida devuelve una página vacía', async () => {
    const { service } = setup({ _id: new Types.ObjectId(), status: 'suspended' });
    await expect(service.userPosts('ana', null, {})).resolves.toMatchObject({ edges: [] });
  });
});

describe('toPostModel', () => {
  const base = {
    _id: new Types.ObjectId(),
    authorId: new Types.ObjectId(),
    author: { handle: 'ana', displayName: 'Ana', avatarUrl256: null },
    title: 't',
    text: '',
    createdAt: new Date(),
  };

  it('rellena contadores ausentes con cero', () => {
    const model = toPostModel({ ...base, visibility: 'public' } as unknown as Post);
    expect(model.counts).toEqual({ reactions: 0, comments: 0, shares: 0 });
  });

  it('conserva followers y expone los posts de grupo como públicos', () => {
    expect(toPostModel({ ...base, visibility: 'followers' } as unknown as Post).visibility).toBe(
      'followers',
    );
    expect(toPostModel({ ...base, visibility: 'group' } as unknown as Post).visibility).toBe(
      'public',
    );
  });
});

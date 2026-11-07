import { ErrorCode } from '@sentio/core';
import { type Model, Types } from 'mongoose';
import { encodeCursor } from '../../../common/pagination/cursor';
import { type AppConfigService } from '../../../config/app-config.service';
import { type Post } from '../../posts/schemas/post.schema';
import { type User } from '../../users/schemas/user.schema';
import { AtlasSearchProvider } from './atlas-search.provider';
import { LocalSearchProvider, postSearchFilter, userSearchFilter } from './local-search.provider';
import { createSearchProvider } from './search-provider.factory';
import { searchTokens } from './search-provider';

describe('searchTokens', () => {
  it('separa palabras y quita el @ de los handles', () => {
    expect(searchTokens('@ana  lopez')).toEqual(['ana', 'lopez']);
    expect(searchTokens('@@')).toEqual([]);
  });
});

describe('LocalSearchProvider: filtros', () => {
  it('personas: cada palabra es prefijo de una palabra del nombre, escapando regex', () => {
    expect(userSearchFilter('jo mu.')).toEqual({
      status: 'active',
      $and: [{ searchName: { $regex: '(^| )jo' } }, { searchName: { $regex: '(^| )mu\\.' } }],
    });
    expect(userSearchFilter('@')).toBeNull();
  });

  it('publicaciones: una palabra va solo por prefijo', () => {
    expect(postSearchFilter('progra')).toEqual({
      status: 'active',
      visibility: 'public',
      groupId: null,
      $or: [{ searchTitle: { $regex: '(^| )progra' } }, { searchText: { $regex: '(^| )progra' } }],
    });
  });

  it('publicaciones: las palabras completas usan el índice de texto (como frases exactas)', () => {
    const filter = postSearchFilter('taller "de" progra')!;
    expect(filter.$text).toEqual({ $search: '"taller" "de"' });
    expect(filter.$or).toEqual([
      { searchTitle: { $regex: '(^| )progra' } },
      { searchText: { $regex: '(^| )progra' } },
    ]);
    expect(postSearchFilter('')).toBeNull();
  });

  it('sin palabras útiles devuelve una página vacía sin consultar', async () => {
    const find = jest.fn();
    const provider = new LocalSearchProvider(
      { find } as unknown as Model<User>,
      { find } as unknown as Model<Post>,
    );
    await expect(provider.searchUsers('@', {})).resolves.toMatchObject({ edges: [] });
    await expect(provider.searchPosts('@', {})).resolves.toMatchObject({ edges: [] });
    expect(find).not.toHaveBeenCalled();
  });
});

describe('AtlasSearchProvider', () => {
  const indexes = { users: 'users_search', posts: 'posts_search' };

  function setup(docs: unknown[]) {
    const aggregate = jest.fn(() => ({ exec: () => Promise.resolve(docs) }));
    const provider = new AtlasSearchProvider(
      { aggregate } as unknown as Model<User>,
      { aggregate } as unknown as Model<Post>,
      indexes,
    );
    return { provider, aggregate };
  }

  it('arma $search de personas con autocompletado por palabra y filtro de estado', () => {
    const { provider } = setup([]);
    const [search, limit, project, token] = provider.usersPipeline('ana lo', 20, null);
    expect(search).toEqual({
      $search: {
        index: 'users_search',
        compound: {
          must: [
            { autocomplete: { query: 'ana', path: 'searchName' } },
            { autocomplete: { query: 'lo', path: 'searchName' } },
          ],
          filter: [{ equals: { path: 'status', value: 'active' } }],
        },
        sort: { handle: 1 },
      },
    });
    expect(limit).toEqual({ $limit: 21 });
    expect(project).toEqual({
      $project: { searchName: 0, searchTitle: 0, searchText: 0, passwordHash: 0 },
    });
    expect(token).toEqual({ $addFields: { _searchToken: { $meta: 'searchSequenceToken' } } });
  });

  it('arma $search de publicaciones públicas y activas, título con más peso, y searchAfter', () => {
    const { provider } = setup([]);
    const [stage] = provider.postsPipeline('progra', 10, 'TOKEN');
    expect(stage).toMatchObject({
      $search: {
        index: 'posts_search',
        searchAfter: 'TOKEN',
        sort: { createdAt: -1, _id: -1 },
        compound: {
          filter: [
            { equals: { path: 'status', value: 'active' } },
            { equals: { path: 'visibility', value: 'public' } },
          ],
        },
      },
    });
    const must = (stage as { $search: { compound: { must: unknown[] } } }).$search.compound.must;
    expect(must).toEqual([
      {
        compound: {
          should: [
            {
              autocomplete: {
                query: 'progra',
                path: 'searchTitle',
                score: { boost: { value: 3 } },
              },
            },
            { autocomplete: { query: 'progra', path: 'searchText' } },
          ],
          minimumShouldMatch: 1,
        },
      },
    ]);
  });

  it('pagina con searchSequenceToken dentro del cursor opaco', async () => {
    const user = (token: string) => ({
      _id: new Types.ObjectId(),
      handle: `h${token}`,
      displayName: 'X',
      avatar: null,
      bio: null,
      tags: [],
      _searchToken: token,
    });
    const { provider, aggregate } = setup([user('t1'), user('t2'), user('t3')]);
    const page = await provider.searchUsers('x', { first: 2 });
    expect(page.edges).toHaveLength(2);
    expect(page.pageInfo).toMatchObject({ hasNextPage: true, hasPreviousPage: false });

    await provider.searchUsers('x', { first: 2, after: page.pageInfo.endCursor });
    const [secondPipeline] = (aggregate.mock.calls[1] ?? []) as unknown as [
      { $search: { searchAfter: string } }[],
    ];
    expect(secondPipeline[0]?.$search.searchAfter).toBe('t2');
  });

  it('devuelve publicaciones y rechaza cursores ajenos o tamaños inválidos', async () => {
    const post = {
      _id: new Types.ObjectId(),
      authorId: new Types.ObjectId(),
      author: { handle: 'a', displayName: 'A', avatarUrl256: null },
      title: 't',
      text: '',
      visibility: 'public',
      createdAt: new Date(),
      _searchToken: 'p1',
    };
    const { provider } = setup([post]);
    await expect(provider.searchPosts('t', {})).resolves.toMatchObject({
      pageInfo: { hasNextPage: false },
    });
    const local = encodeCursor({ key: Date.now(), id: new Types.ObjectId().toHexString() });
    await expect(provider.searchPosts('t', { after: local })).rejects.toMatchObject({
      extensions: { code: ErrorCode.BAD_USER_INPUT },
    });
    await expect(provider.searchUsers('t', { first: 0 })).rejects.toMatchObject({
      extensions: { code: ErrorCode.BAD_USER_INPUT },
    });
  });
});

describe('createSearchProvider', () => {
  const config = (env: Record<string, string>) =>
    ({ get: (k: string) => env[k] }) as unknown as AppConfigService;
  const users = {} as Model<User>;
  const posts = {} as Model<Post>;

  it('elige el provider con SEARCH_PROVIDER', () => {
    expect(createSearchProvider(config({ SEARCH_PROVIDER: 'local' }), users, posts)).toBeInstanceOf(
      LocalSearchProvider,
    );
    expect(
      createSearchProvider(
        config({
          SEARCH_PROVIDER: 'atlas',
          ATLAS_SEARCH_USERS_INDEX: 'u',
          ATLAS_SEARCH_POSTS_INDEX: 'p',
        }),
        users,
        posts,
      ),
    ).toBeInstanceOf(AtlasSearchProvider);
  });
});

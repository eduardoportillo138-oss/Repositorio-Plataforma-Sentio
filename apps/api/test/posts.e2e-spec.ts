import { getModelToken } from '@nestjs/mongoose';
import { ErrorCode } from '@sentio/core';
import { type Model, Types } from 'mongoose';
import { AuthorSyncService } from '../src/modules/posts/author-sync.service';
import { Post } from '../src/modules/posts/schemas/post.schema';
import { errorCode, fieldErrors, registerUser, type TestUser } from './utils/helpers';
import { createTestApp, type GqlResult, type TestApp } from './utils/test-app';

const POST_FIELDS = `id title text visibility createdAt viewerIsAuthor
  counts { reactions comments shares }
  author { id handle displayName avatar { url256 } bio tags }`;

const CREATE = `mutation($input: CreatePostInput!) { createPost(input: $input) { ${POST_FIELDS} } }`;
const DELETE = `mutation($postId: ID!) { deletePost(postId: $postId) }`;
const HOME = `query($first: Int, $after: String) {
  homeFeed(first: $first, after: $after) {
    edges { cursor node { ${POST_FIELDS} } }
    pageInfo { hasNextPage hasPreviousPage endCursor startCursor }
  }
}`;
const USER_POSTS = `query($handle: String!, $first: Int, $after: String) {
  userPosts(handle: $handle, first: $first, after: $after) {
    edges { cursor node { id title visibility } }
    pageInfo { hasNextPage endCursor }
  }
}`;

interface PostNode {
  id: string;
  title: string;
  text: string;
  visibility: 'public' | 'followers';
  createdAt: string;
  viewerIsAuthor: boolean;
  counts: { reactions: number; comments: number; shares: number };
  author: {
    id: string;
    handle: string;
    displayName: string;
    avatar: { url256: string } | null;
    bio: string | null;
    tags: string[];
  };
}

interface Page<N> {
  edges: { cursor: string; node: N }[];
  pageInfo: { hasNextPage: boolean; hasPreviousPage?: boolean; endCursor: string | null };
}

let t: TestApp;
let posts: Model<Post>;
let ana: TestUser;
let beto: TestUser;

beforeAll(async () => {
  t = await createTestApp();
  posts = t.app.get<Model<Post>>(getModelToken(Post.name));
  ana = await registerUser(t, 'ana');
  beto = await registerUser(t, 'beto');
});

afterAll(async () => {
  await t?.app.get(AuthorSyncService).drain();
  await t?.close();
});

async function createPost(user: TestUser, input: Record<string, unknown>) {
  return t.gql<{ createPost: PostNode }>(CREATE, { input }, { token: user.token });
}

/** Recorre todas las páginas de una consulta y devuelve los ids en orden. */
async function collect(
  query: string,
  variables: Record<string, unknown>,
  token: string,
  field: 'homeFeed' | 'userPosts',
  first = 20,
): Promise<{ ids: string[]; pages: number[] }> {
  const ids: string[] = [];
  const pages: number[] = [];
  let after: string | null = null;
  for (let i = 0; i < 100; i++) {
    const res: GqlResult<Record<string, Page<{ id: string }>>> = await t.gql(
      query,
      { ...variables, first, after },
      { token },
    );
    expect(res.errors).toBeUndefined();
    const page: Page<{ id: string }> = res.data![field]!;
    pages.push(page.edges.length);
    ids.push(...page.edges.map((e) => e.node.id));
    if (!page.pageInfo.hasNextPage) break;
    after = page.pageInfo.endCursor;
  }
  return { ids, pages };
}

describe('createPost', () => {
  it('crea una publicación pública con el autor y contadores en cero', async () => {
    const res = await createPost(ana, { title: '  Mi primera publicación ', text: 'Hola' });
    expect(res.errors).toBeUndefined();
    expect(res.data!.createPost).toMatchObject({
      title: 'Mi primera publicación',
      text: 'Hola',
      visibility: 'public',
      viewerIsAuthor: true,
      counts: { reactions: 0, comments: 0, shares: 0 },
      author: { id: ana.id, handle: ana.handle },
    });
  });

  it.each([
    ['título vacío', { title: '   ' }, 'title', 'validation.post.titleRequired'],
    ['título de 121', { title: 'a'.repeat(121) }, 'title', 'validation.post.titleMax'],
    [
      'descripción de 5001',
      { title: 'x', text: 'a'.repeat(5001) },
      'text',
      'validation.post.textMax',
    ],
  ])('rechaza %s', async (_name, input, field, message) => {
    const res = await createPost(beto, input);
    expect(errorCode(res)).toBe(ErrorCode.BAD_USER_INPUT);
    expect(fieldErrors(res)[field]).toContain(message);
  });

  it('exige sesión', async () => {
    const res = await t.gql(CREATE, { input: { title: 'x' } });
    expect(errorCode(res)).toBe(ErrorCode.UNAUTHENTICATED);
  });

  it('limita a 10 publicaciones por hora por usuario', async () => {
    const carla = await registerUser(t, 'carla');
    for (let i = 1; i <= 10; i++) {
      const ok = await createPost(carla, { title: `Post ${i}` });
      expect(ok.errors).toBeUndefined();
    }
    const blocked = await createPost(carla, { title: 'Post 11' });
    expect(errorCode(blocked)).toBe(ErrorCode.RATE_LIMITED);
    // El límite es por usuario: otra persona puede seguir publicando.
    const other = await createPost(beto, { title: 'Sigo pudiendo' });
    expect(other.errors).toBeUndefined();
  });
});

describe('deletePost', () => {
  it('solo el autor puede borrar; después desaparece de los listados', async () => {
    const post = (await createPost(ana, { title: 'Para borrar' })).data!.createPost;

    const forbidden = await t.gql(DELETE, { postId: post.id }, { token: beto.token });
    expect(errorCode(forbidden)).toBe(ErrorCode.FORBIDDEN);

    const ok = await t.gql<{ deletePost: string }>(
      DELETE,
      { postId: post.id },
      { token: ana.token },
    );
    expect(ok.data!.deletePost).toBe(post.id);
    expect((await posts.findById(post.id).lean())!.status).toBe('removed');

    const home = await collect(HOME, {}, beto.token, 'homeFeed', 50);
    expect(home.ids).not.toContain(post.id);
    const mine = await collect(USER_POSTS, { handle: ana.handle }, ana.token, 'userPosts', 50);
    expect(mine.ids).not.toContain(post.id);
  });

  it('borrar dos veces o un id inexistente da NOT_FOUND', async () => {
    const post = (await createPost(ana, { title: 'Dos veces' })).data!.createPost;
    await t.gql(DELETE, { postId: post.id }, { token: ana.token });
    const again = await t.gql(DELETE, { postId: post.id }, { token: ana.token });
    expect(errorCode(again)).toBe(ErrorCode.NOT_FOUND);
    const missing = await t.gql(
      DELETE,
      { postId: new Types.ObjectId().toHexString() },
      { token: ana.token },
    );
    expect(errorCode(missing)).toBe(ErrorCode.NOT_FOUND);
  });

  it('valida el id', async () => {
    const res = await t.gql(DELETE, { postId: 'nope' }, { token: ana.token });
    expect(errorCode(res)).toBe(ErrorCode.BAD_USER_INPUT);
  });
});

describe('visibilidad', () => {
  it('un post para seguidores no sale en homeFeed ni lo ven otros en userPosts; el autor sí', async () => {
    const post = (await createPost(ana, { title: 'Solo seguidores', visibility: 'followers' }))
      .data!.createPost;
    expect(post.visibility).toBe('followers');

    const home = await collect(HOME, {}, beto.token, 'homeFeed', 50);
    expect(home.ids).not.toContain(post.id);

    const asOther = await collect(USER_POSTS, { handle: ana.handle }, beto.token, 'userPosts', 50);
    expect(asOther.ids).not.toContain(post.id);

    const asSelf = await collect(USER_POSTS, { handle: ana.handle }, ana.token, 'userPosts', 50);
    expect(asSelf.ids).toContain(post.id);
  });

  it('userPosts de un handle inexistente devuelve una página vacía', async () => {
    const res = await t.gql<{ userPosts: Page<{ id: string }> }>(
      USER_POSTS,
      { handle: 'no_existe_xyz' },
      { token: beto.token },
    );
    expect(res.data!.userPosts).toEqual({
      edges: [],
      pageInfo: { hasNextPage: false, endCursor: null },
    });
  });
});

describe('paginación por cursor', () => {
  let dana: TestUser;
  let expected: string[];

  beforeAll(async () => {
    dana = await registerUser(t, 'dana');
    // 45 posts sembrados directamente (sin pasar por el límite de 10/h). Hay grupos con la misma
    // fecha para comprobar el desempate por _id.
    const base = Date.now() - 60 * 60 * 1000;
    const docs = Array.from({ length: 45 }, (_, i) => ({
      _id: new Types.ObjectId(),
      authorId: new Types.ObjectId(dana.id),
      author: { handle: dana.handle, displayName: 'Dana', avatarUrl256: null },
      title: `Sembrado ${i}`,
      text: '',
      visibility: 'public',
      createdAt: new Date(base + Math.floor(i / 3) * 1000),
      updatedAt: new Date(),
    }));
    await posts.insertMany(docs, { timestamps: false } as never);
    expected = [...docs]
      .sort(
        (a, b) =>
          b.createdAt.getTime() - a.createdAt.getTime() ||
          b._id.toHexString().localeCompare(a._id.toHexString()),
      )
      .map((d) => d._id.toHexString());
  });

  it('userPosts: 20 + 20 + 5, sin repetir ni saltar, en orden descendente', async () => {
    const { ids, pages } = await collect(
      USER_POSTS,
      { handle: dana.handle },
      beto.token,
      'userPosts',
    );
    expect(pages).toEqual([20, 20, 5]);
    expect(new Set(ids).size).toBe(45);
    expect(ids).toEqual(expected);
  });

  it('una publicación nueva entre páginas no provoca repetidos ni saltos', async () => {
    const first = await t.gql<{ userPosts: Page<{ id: string }> }>(
      USER_POSTS,
      { handle: dana.handle, first: 20 },
      { token: beto.token },
    );
    const page1 = first.data!.userPosts.edges.map((e) => e.node.id);

    const fresh = (await createPost(dana, { title: 'Recién publicado' })).data!.createPost;

    // Continúa desde el cursor de la primera página.
    const ids = [...page1];
    let after = first.data!.userPosts.pageInfo.endCursor;
    for (;;) {
      const res = await t.gql<{ userPosts: Page<{ id: string }> }>(
        USER_POSTS,
        { handle: dana.handle, first: 20, after },
        { token: beto.token },
      );
      ids.push(...res.data!.userPosts.edges.map((e) => e.node.id));
      if (!res.data!.userPosts.pageInfo.hasNextPage) break;
      after = res.data!.userPosts.pageInfo.endCursor;
    }
    expect(ids).toEqual(expected);
    expect(ids).not.toContain(fresh.id);
  });

  it('homeFeed: sin repetidos, orden descendente y con los sembrados en su orden', async () => {
    const { ids } = await collect(HOME, {}, beto.token, 'homeFeed');
    expect(new Set(ids).size).toBe(ids.length);
    const seeded = ids.filter((id) => expected.includes(id));
    expect(seeded).toEqual(expected);

    const res = await t.gql<{ homeFeed: Page<PostNode> }>(
      HOME,
      { first: 50 },
      { token: beto.token },
    );
    const dates = res.data!.homeFeed.edges.map((e) => new Date(e.node.createdAt).getTime());
    expect([...dates].sort((a, b) => b - a)).toEqual(dates);
    expect(res.data!.homeFeed.pageInfo.hasPreviousPage).toBe(false);
  });

  it('valida first y el cursor', async () => {
    for (const first of [0, 51]) {
      const res = await t.gql(HOME, { first }, { token: beto.token });
      expect(errorCode(res)).toBe(ErrorCode.BAD_USER_INPUT);
    }
    const bad = await t.gql(HOME, { after: 'basura' }, { token: beto.token });
    expect(errorCode(bad)).toBe(ErrorCode.BAD_USER_INPUT);
  });

  it('homeFeed exige sesión', async () => {
    const res = await t.gql(HOME, {});
    expect(errorCode(res)).toBe(ErrorCode.UNAUTHENTICATED);
  });
});

describe('autor de la publicación', () => {
  it('solo expone datos públicos: pedir privateContact o email del autor es un error de validación', async () => {
    for (const field of ['privateContact { phone }', 'email', 'consents { marketingOptIn }']) {
      const res = await t.gql(
        `query { homeFeed(first: 1) { edges { node { author { ${field} } } } } }`,
        {},
        { token: beto.token },
      );
      // El campo ni siquiera existe en el tipo PublicUser: la consulta no pasa la validación.
      expect(res.status).toBe(400);
      expect(res.data).toBeNull();
      expect(res.errors?.[0]?.message).toMatch(/Cannot query field .* on type "PublicUser"/);
    }
  });

  it('no filtra datos privados del autor en la respuesta', async () => {
    await t.gql(
      `mutation { updatePrivateContact(input: { phone: "+525511112222", institution: "Instituto Secreto" }) { id } }`,
      {},
      { token: ana.token },
    );
    const post = (await createPost(ana, { title: 'Con datos privados guardados' })).data!
      .createPost;
    const raw = JSON.stringify((await t.gql(HOME, { first: 50 }, { token: beto.token })).data);
    expect(raw).toContain(post.id);
    expect(raw).not.toContain('+525511112222');
    expect(raw).not.toContain('Instituto Secreto');
    expect(raw).not.toContain('@example.test');
  });

  it('viewerIsAuthor es false para otras personas', async () => {
    const res = await t.gql<{ homeFeed: Page<PostNode> }>(
      HOME,
      { first: 50 },
      { token: beto.token },
    );
    const anaPosts = res.data!.homeFeed.edges.filter((e) => e.node.author.id === ana.id);
    expect(anaPosts.length).toBeGreaterThan(0);
    for (const e of anaPosts) expect(e.node.viewerIsAuthor).toBe(false);
  });

  it('al cambiar el nombre, el autor se ve actualizado y la copia se sincroniza', async () => {
    const post = (await createPost(beto, { title: 'Antes del cambio' })).data!.createPost;
    await t.gql(
      `mutation { updateProfile(input: { displayName: "Beto Renombrado" }) { id } }`,
      {},
      { token: beto.token },
    );

    const res = await t.gql<{ homeFeed: Page<PostNode> }>(
      HOME,
      { first: 50 },
      { token: ana.token },
    );
    const node = res.data!.homeFeed.edges.find((e) => e.node.id === post.id)!.node;
    expect(node.author.displayName).toBe('Beto Renombrado');

    await t.app.get(AuthorSyncService).drain();
    const stored = await posts.find({ authorId: new Types.ObjectId(beto.id) }).lean();
    expect(stored.length).toBeGreaterThan(1);
    for (const p of stored) expect(p.author.displayName).toBe('Beto Renombrado');
  });

  it('si la cuenta del autor ya no está activa, usa la copia guardada', async () => {
    const eva = await registerUser(t, 'eva');
    const post = (await createPost(eva, { title: 'Cuenta que se suspende' })).data!.createPost;
    await t.app
      .get<Model<{ status: string }>>(getModelToken('User'))
      .updateOne({ _id: eva.id }, { $set: { status: 'suspended' } });
    const res = await t.gql<{ homeFeed: Page<PostNode> }>(
      HOME,
      { first: 50 },
      { token: beto.token },
    );
    const node = res.data!.homeFeed.edges.find((e) => e.node.id === post.id)!.node;
    expect(node.author).toEqual({
      id: eva.id,
      handle: eva.handle,
      displayName: post.author.displayName,
      avatar: null,
      bio: null,
      tags: [],
    });
  });
});

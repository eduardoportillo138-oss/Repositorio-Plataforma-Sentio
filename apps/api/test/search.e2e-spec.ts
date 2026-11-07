import { getModelToken } from '@nestjs/mongoose';
import { ErrorCode } from '@sentio/core';
import { type Model, Types } from 'mongoose';
import { type Post } from '../src/modules/posts/schemas/post.schema';
import { backfillSearchFields } from '../src/modules/search/backfill';
import { type User } from '../src/modules/users/schemas/user.schema';
import { errorCode, fieldErrors, registerUser, type TestUser } from './utils/helpers';
import { createTestApp, type GqlResult, type TestApp } from './utils/test-app';

const USERS = `query($query: String!, $first: Int, $after: String) {
  searchUsers(query: $query, first: $first, after: $after) {
    edges { node { id handle displayName tags bio avatar { url256 } } }
    pageInfo { hasNextPage endCursor }
  }
}`;
const POSTS = `query($query: String!, $first: Int, $after: String) {
  searchPosts(query: $query, first: $first, after: $after) {
    edges { node { id title text author { id handle displayName } } }
    pageInfo { hasNextPage endCursor }
  }
}`;
const RECENT = `query { recentSearches { id query searchedAt } }`;
const CLEAR = `mutation { clearSearchHistory }`;
const CREATE = `mutation($input: CreatePostInput!) { createPost(input: $input) { id } }`;

type Page<N> = {
  edges: { node: N }[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
};

let t: TestApp;
let users: Model<User>;
let posts: Model<Post>;
let jose: TestUser;
let viewer: TestUser;
/** Sufijo único: los archivos e2e comparten base de datos y corren en paralelo. */
const tag = Date.now().toString(36);

beforeAll(async () => {
  t = await createTestApp();
  users = t.app.get<Model<User>>(getModelToken('User'));
  posts = t.app.get<Model<Post>>(getModelToken('Post'));
  jose = await registerUser(t, 'jose');
  viewer = await registerUser(t, 'mira');
  await t.gql(
    `mutation($n: String!) { updateProfile(input: { displayName: $n, tags: ["curious"] }) { id } }`,
    { n: `José Muñoz ${tag}` },
    { token: jose.token },
  );
  await t.gql(
    `mutation { updatePrivateContact(input: { phone: "+525577776666", institution: "Instituto Oculto" }) { id } }`,
    {},
    { token: jose.token },
  );
});

afterAll(async () => {
  await t?.close();
});

// Cada prueba busca con una persona nueva: el límite es de 30 búsquedas por minuto y persona.
beforeEach(async () => {
  viewer = await registerUser(t, 'mira');
});

const tick = () => new Promise((r) => setTimeout(r, 5));

const searchUsers = (query: string, token = viewer.token, extra: Record<string, unknown> = {}) =>
  t.gql<{ searchUsers: Page<{ id: string; handle: string; displayName: string; tags: string[] }> }>(
    USERS,
    { query, ...extra },
    { token },
  );
const searchPosts = (query: string, token = viewer.token, extra: Record<string, unknown> = {}) =>
  t.gql<{ searchPosts: Page<{ id: string; title: string; text: string }> }>(
    POSTS,
    { query, ...extra },
    { token },
  );
const ids = <N extends { id: string }>(r: GqlResult<Record<string, Page<N>>>, field: string) =>
  r.data![field]!.edges.map((e) => e.node.id);

describe('searchUsers', () => {
  it('ignora acentos y mayúsculas: "jose munoz" encuentra a "José Muñoz"', async () => {
    for (const q of ['jose', 'JOSÉ', `munoz ${tag}`, `josé muñoz ${tag.slice(0, 3)}`]) {
      const res = await searchUsers(q);
      expect(res.errors).toBeUndefined();
      expect(ids(res, 'searchUsers')).toContain(jose.id);
    }
  });

  it('encuentra por prefijo del handle, con o sin @', async () => {
    for (const q of [jose.handle.slice(0, 5), `@${jose.handle.slice(0, 5)}`]) {
      expect(ids(await searchUsers(q), 'searchUsers')).toContain(jose.id);
    }
  });

  it('devuelve datos públicos con etiquetas y nunca datos privados', async () => {
    const res = await searchUsers(`munoz ${tag}`);
    const node = res.data!.searchUsers.edges.find((e) => e.node.id === jose.id)!.node;
    expect(node.tags).toEqual(['curious']);
    const raw = JSON.stringify(res.data);
    expect(raw).not.toContain('+525577776666');
    expect(raw).not.toContain('Instituto Oculto');
    expect(raw).not.toContain('@example.test');
  });

  it('pedir campos privados no pasa la validación del esquema', async () => {
    for (const field of ['email', 'privateContact { phone }', 'consents { marketingOptIn }']) {
      const res = await t.gql(
        `query { searchUsers(query: "jose") { edges { node { ${field} } } } }`,
        {},
        { token: viewer.token },
      );
      expect(res.status).toBe(400);
    }
  });

  it('no muestra cuentas suspendidas', async () => {
    const ghost = await registerUser(t, 'fantasma');
    await users.updateOne({ _id: ghost.id }, { $set: { status: 'suspended' } });
    expect(ids(await searchUsers(ghost.handle), 'searchUsers')).not.toContain(ghost.id);
  });

  it('pagina sin repetir ni saltar', async () => {
    for (let i = 0; i < 7; i++) {
      const u = await registerUser(t, 'pag');
      await t.gql(
        `mutation($n: String!) { updateProfile(input: { displayName: $n }) { id } }`,
        { n: `Pagina ${tag} ${i}` },
        { token: u.token },
      );
    }
    const query = `pagina ${tag}`;
    const all = ids(await searchUsers(query, viewer.token, { first: 50 }), 'searchUsers');
    expect(all).toHaveLength(7);
    const seen: string[] = [];
    let after: string | null = null;
    for (;;) {
      const res = await searchUsers(query, viewer.token, { first: 3, after });
      seen.push(...ids(res, 'searchUsers'));
      if (!res.data!.searchUsers.pageInfo.hasNextPage) break;
      after = res.data!.searchUsers.pageInfo.endCursor;
    }
    expect(seen).toEqual(all);
  });
});

describe('searchPosts', () => {
  let titleHit: string;
  let textHit: string;
  let followers: string;
  let removed: string;

  beforeAll(async () => {
    const create = async (input: Record<string, unknown>) =>
      (await t.gql<{ createPost: { id: string } }>(CREATE, { input }, { token: jose.token })).data!
        .createPost.id;
    titleHit = await create({ title: `Taller de Programación ${tag}`, text: 'Los sábados.' });
    textHit = await create({
      title: `Aviso ${tag}`,
      text: 'Habrá un club de lectura y también de programación competitiva.',
    });
    followers = await create({ title: `Programación privada ${tag}`, visibility: 'followers' });
    removed = await create({ title: `Programación borrada ${tag}` });
    await t.gql(
      `mutation($id: ID!) { deletePost(postId: $id) }`,
      { id: removed },
      { token: jose.token },
    );
  });

  it('encuentra coincidencias en el título y en la descripción, sin acentos', async () => {
    const res = await searchPosts(`${tag} programacion`);
    expect(res.errors).toBeUndefined();
    const found = ids(res, 'searchPosts');
    expect(found).toContain(titleHit);
    expect(found).toContain(textHit);
  });

  it('la última palabra puede estar a medio escribir', async () => {
    expect(ids(await searchPosts(`${tag} progra`), 'searchPosts')).toEqual(
      expect.arrayContaining([titleHit, textHit]),
    );
    expect(ids(await searchPosts(`taller ${tag.slice(0, 4)}`), 'searchPosts')).toContain(titleHit);
  });

  it('con varias palabras exige todas', async () => {
    const found = ids(await searchPosts(`${tag} lectura progra`), 'searchPosts');
    expect(found).toEqual([textHit]);
  });

  it('excluye publicaciones borradas y las que no son públicas, también para su autor', async () => {
    for (const token of [viewer.token, jose.token]) {
      const found = ids(await searchPosts(`${tag} programacion`, token), 'searchPosts');
      expect(found).not.toContain(followers);
      expect(found).not.toContain(removed);
    }
  });

  it('el autor de los resultados no expone datos privados', async () => {
    const res = await searchPosts(`${tag} programacion`);
    expect(JSON.stringify(res.data)).not.toContain('+525577776666');
    const asking = await t.gql(
      `query { searchPosts(query: "programacion") { edges { node { author { privateContact { phone } } } } } }`,
      {},
      { token: viewer.token },
    );
    expect(asking.status).toBe(400);
  });

  it('ordena de la más reciente a la más antigua', async () => {
    expect(ids(await searchPosts(`${tag} programacion`), 'searchPosts')).toEqual([
      textHit,
      titleHit,
    ]);
  });
});

describe('validación', () => {
  it('exige de 2 a 80 caracteres', async () => {
    for (const [q, message] of [
      ['a', 'validation.search.min'],
      ['   a   ', 'validation.search.min'],
      ['a'.repeat(81), 'validation.search.max'],
    ] as const) {
      for (const run of [searchUsers, searchPosts]) {
        const res = await run(q);
        expect(errorCode(res)).toBe(ErrorCode.BAD_USER_INPUT);
        expect(fieldErrors(res).query).toContain(message);
      }
    }
  });

  it('trata los caracteres especiales de regex como texto', async () => {
    for (const q of ['.*', '((', '\\d+', '"comillas"', '$where']) {
      const u = await searchUsers(q);
      const p = await searchPosts(q);
      expect(u.errors).toBeUndefined();
      expect(p.errors).toBeUndefined();
      expect(u.data!.searchUsers.edges).toEqual([]);
    }
  });
});

describe('búsquedas recientes', () => {
  let ana: TestUser;

  beforeAll(async () => {
    ana = await registerUser(t, 'hist');
  });

  it('guarda solo la primera página, sin duplicados, de la más reciente a la más antigua', async () => {
    // Pausas mínimas para que cada búsqueda tenga una fecha distinta.
    await searchUsers('Primera', ana.token);
    await tick();
    await searchPosts('segunda', ana.token);
    await tick();
    await searchUsers('primera', ana.token); // repetida (otra capitalización): sube al principio
    await tick();
    const page = await searchUsers('usuario', ana.token, { first: 1 });
    await searchUsers('usuario', ana.token, {
      first: 1,
      after: page.data!.searchUsers.pageInfo.endCursor,
    });

    const res = await t.gql<{ recentSearches: { query: string }[] }>(
      RECENT,
      {},
      { token: ana.token },
    );
    expect(res.data!.recentSearches.map((r) => r.query)).toEqual(['usuario', 'primera', 'segunda']);
  });

  it('cada persona ve solo su historial y puede borrarlo', async () => {
    const other = await t.gql<{ recentSearches: { query: string }[] }>(
      RECENT,
      {},
      { token: jose.token },
    );
    expect(other.data!.recentSearches.map((r) => r.query)).not.toContain('segunda');

    const cleared = await t.gql<{ clearSearchHistory: boolean }>(CLEAR, {}, { token: ana.token });
    expect(cleared.data!.clearSearchHistory).toBe(true);
    const after = await t.gql<{ recentSearches: unknown[] }>(RECENT, {}, { token: ana.token });
    expect(after.data!.recentSearches).toEqual([]);
  });

  it('una búsqueda inválida no se guarda', async () => {
    const res = await searchUsers('x', ana.token);
    expect(errorCode(res)).toBe(ErrorCode.BAD_USER_INPUT);
    const recent = await t.gql<{ recentSearches: unknown[] }>(RECENT, {}, { token: ana.token });
    expect(recent.data!.recentSearches).toEqual([]);
  });
});

describe('límite de búsquedas', () => {
  it('la búsqueda 31 en un minuto da RATE_LIMITED (personas y publicaciones comparten contador)', async () => {
    const busy = await registerUser(t, 'rapida');
    for (let i = 0; i < 30; i++) {
      const res =
        i % 2 ? await searchUsers('abc', busy.token) : await searchPosts('abc', busy.token);
      expect(res.errors).toBeUndefined();
    }
    expect(errorCode(await searchPosts('abc', busy.token))).toBe(ErrorCode.RATE_LIMITED);
    // El límite es por persona.
    expect((await searchUsers('abc')).errors).toBeUndefined();
  });
});

describe('backfill de campos normalizados', () => {
  it('llena searchName, searchTitle y searchText en documentos anteriores', async () => {
    const old = await registerUser(t, 'viejo');
    await users.updateOne(
      { _id: old.id },
      { $set: { displayName: `Ñandú Ábaco ${tag}` }, $unset: { searchName: '' } },
    );
    const post = await posts.create({
      authorId: new Types.ObjectId(old.id),
      author: { handle: old.handle, displayName: 'x', avatarUrl256: null },
      title: `Árbol Genealógico ${tag}`,
      text: 'Índice',
    });

    expect(ids(await searchUsers(`nandu abaco ${tag}`), 'searchUsers')).not.toContain(old.id);
    const result = await backfillSearchFields(users, posts);
    expect(result.users).toBeGreaterThanOrEqual(1);
    expect(result.posts).toBeGreaterThanOrEqual(1);

    expect(ids(await searchUsers(`nandu abaco ${tag}`), 'searchUsers')).toContain(old.id);
    expect(ids(await searchPosts(`arbol genea`), 'searchPosts')).toContain(post._id.toHexString());

    // Idempotente.
    const again = await backfillSearchFields(users, posts);
    expect(again).toEqual({ users: 0, posts: 0 });
  });
});

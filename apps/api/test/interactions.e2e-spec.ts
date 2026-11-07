import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { ErrorCode } from '@sentio/core';
import { type Connection, type Model, Types } from 'mongoose';
import { BLOCKS_COLLECTION } from '../src/modules/shares/blocks/block-checker';
import { type Post } from '../src/modules/posts/schemas/post.schema';
import { type Reaction } from '../src/modules/reactions/schemas/reaction.schema';
import {
  connectSocket,
  errorCode,
  fieldErrors,
  listen,
  nextEvent,
  registerUser,
  type TestUser,
} from './utils/helpers';
import { createTestApp, type TestApp } from './utils/test-app';

const POST_FIELDS = `id title viewerHasLiked counts { reactions comments shares }`;
const TOGGLE = `mutation($postId: ID!) { toggleLike(postId: $postId) { ${POST_FIELDS} } }`;
const POST = `query($id: ID!) { post(id: $id) { ${POST_FIELDS} author { handle } } }`;
const HOME = `query { homeFeed(first: 50) { edges { node { ${POST_FIELDS} } } } }`;
const ADD_COMMENT = `mutation($postId: ID!, $text: String!) {
  addComment(postId: $postId, text: $text) {
    id text viewerCanDelete author { id handle } post { id counts { comments } }
  }
}`;
const DELETE_COMMENT = `mutation($commentId: ID!) { deleteComment(commentId: $commentId) { id counts { comments } } }`;
const COMMENTS = `query($postId: ID!, $first: Int, $after: String) {
  postComments(postId: $postId, first: $first, after: $after) {
    edges { node { id text viewerCanDelete author { id handle displayName } } }
    pageInfo { hasNextPage endCursor }
  }
}`;
const SHARE = `mutation($postId: ID!, $recipientIds: [ID!]!, $message: String) {
  sharePost(postId: $postId, recipientIds: $recipientIds, message: $message) {
    sentTo post { id counts { shares } }
  }
}`;
const NOTIFICATIONS = `query {
  notifications(first: 20) {
    edges { node { id type message readAt actor { id handle } post { id title } } }
  }
  unreadNotificationsCount
}`;
const SEARCH = `query($query: String!, $first: Int, $after: String) {
  searchUsers(query: $query, first: $first, after: $after) {
    edges { node { id handle displayName avatar { url256 } bio tags } }
    pageInfo { hasNextPage endCursor }
  }
}`;

interface PostNode {
  id: string;
  title: string;
  viewerHasLiked: boolean;
  counts: { reactions: number; comments: number; shares: number };
}

let t: TestApp;
let posts: Model<Post>;
let reactions: Model<Reaction>;
let ana: TestUser;
let beto: TestUser;
let carla: TestUser;

beforeAll(async () => {
  t = await createTestApp();
  posts = t.app.get<Model<Post>>(getModelToken('Post'));
  reactions = t.app.get<Model<Reaction>>(getModelToken('Reaction'));
  ana = await registerUser(t, 'ana');
  beto = await registerUser(t, 'beto');
  carla = await registerUser(t, 'carla');
});

afterAll(async () => {
  await t?.close();
});

/**
 * Siembra un post directamente en el modelo: el límite de 10/h de createPost ya se prueba en
 * posts.e2e-spec.ts y aquí se necesitan muchos posts por persona.
 */
async function newPost(user: TestUser, input: Record<string, unknown> = {}): Promise<PostNode> {
  const doc = await posts.create({
    authorId: new Types.ObjectId(user.id),
    author: { handle: user.handle, displayName: user.handle, avatarUrl256: null },
    title: `Post ${Math.random().toString(36).slice(2, 8)}`,
    text: '',
    visibility: 'public',
    ...input,
  });
  return {
    id: doc._id.toHexString(),
    title: doc.title,
    viewerHasLiked: false,
    counts: { reactions: 0, comments: 0, shares: 0 },
  };
}

describe('toggleLike', () => {
  it('da y quita "Me gusta" con contador y viewerHasLiked', async () => {
    const post = await newPost(ana);
    const liked = await t.gql<{ toggleLike: PostNode }>(
      TOGGLE,
      { postId: post.id },
      { token: beto.token },
    );
    expect(liked.data!.toggleLike).toMatchObject({
      viewerHasLiked: true,
      counts: { reactions: 1 },
    });

    const unliked = await t.gql<{ toggleLike: PostNode }>(
      TOGGLE,
      { postId: post.id },
      { token: beto.token },
    );
    expect(unliked.data!.toggleLike).toMatchObject({
      viewerHasLiked: false,
      counts: { reactions: 0 },
    });
  });

  it('viewerHasLiked es por persona en la misma página', async () => {
    const post = await newPost(ana);
    await t.gql(TOGGLE, { postId: post.id }, { token: beto.token });
    const asBeto = await t.gql<{ homeFeed: { edges: { node: PostNode }[] } }>(
      HOME,
      {},
      { token: beto.token },
    );
    const asCarla = await t.gql<{ homeFeed: { edges: { node: PostNode }[] } }>(
      HOME,
      {},
      { token: carla.token },
    );
    const find = (r: typeof asBeto) =>
      r.data!.homeFeed.edges.find((e) => e.node.id === post.id)!.node;
    expect(find(asBeto)).toMatchObject({ viewerHasLiked: true, counts: { reactions: 1 } });
    expect(find(asCarla)).toMatchObject({ viewerHasLiked: false, counts: { reactions: 1 } });
  });

  it('no se puede dar "Me gusta" dos veces: el índice único lo impide', async () => {
    const post = await newPost(ana);
    await t.gql(TOGGLE, { postId: post.id }, { token: carla.token });
    await expect(
      reactions.create({
        targetType: 'post',
        targetId: new Types.ObjectId(post.id),
        userId: new Types.ObjectId(carla.id),
        type: 'like',
      }),
    ).rejects.toMatchObject({ code: 11000 });
    expect(await reactions.countDocuments({ targetId: new Types.ObjectId(post.id) })).toBe(1);
  });

  it('toggles simultáneos dejan el contador igual a las reacciones guardadas', async () => {
    const post = await newPost(ana);
    const results = await Promise.all(
      Array.from({ length: 5 }, () => t.gql(TOGGLE, { postId: post.id }, { token: beto.token })),
    );
    for (const r of results) expect(r.errors).toBeUndefined();
    const stored = await reactions.countDocuments({ targetId: new Types.ObjectId(post.id) });
    const doc = await posts.findById(post.id).lean();
    expect(stored).toBeLessThanOrEqual(1);
    expect(doc!.counts.reactions).toBe(stored);
    // 5 toggles = número impar: termina con "Me gusta".
    expect(stored).toBe(1);
  });

  it('no permite dar "Me gusta" a un post borrado o que no se puede ver', async () => {
    const removed = await newPost(ana);
    await t.gql(
      `mutation($id: ID!) { deletePost(postId: $id) }`,
      { id: removed.id },
      { token: ana.token },
    );
    const r1 = await t.gql(TOGGLE, { postId: removed.id }, { token: beto.token });
    expect(errorCode(r1)).toBe(ErrorCode.NOT_FOUND);

    const hidden = await newPost(ana, { visibility: 'followers' });
    const r2 = await t.gql(TOGGLE, { postId: hidden.id }, { token: beto.token });
    expect(errorCode(r2)).toBe(ErrorCode.NOT_FOUND);
    // El autor sí puede.
    const own = await t.gql<{ toggleLike: PostNode }>(
      TOGGLE,
      { postId: hidden.id },
      { token: ana.token },
    );
    expect(own.data!.toggleLike.viewerHasLiked).toBe(true);
  });
});

describe('post(id)', () => {
  it('devuelve el post visible y null si está borrado o no se puede ver', async () => {
    const visible = await newPost(ana);
    const ok = await t.gql<{ post: PostNode & { author: { handle: string } } }>(
      POST,
      { id: visible.id },
      { token: beto.token },
    );
    expect(ok.data!.post).toMatchObject({ id: visible.id, author: { handle: ana.handle } });

    const hidden = await newPost(ana, { visibility: 'followers' });
    const no = await t.gql<{ post: null }>(POST, { id: hidden.id }, { token: beto.token });
    expect(no.data!.post).toBeNull();

    const missing = await t.gql<{ post: null }>(
      POST,
      { id: new Types.ObjectId().toHexString() },
      { token: beto.token },
    );
    expect(missing.data!.post).toBeNull();
  });
});

describe('comentarios', () => {
  let post: PostNode;

  beforeAll(async () => {
    post = await newPost(ana, { title: 'Con comentarios' });
  });

  it('valida el texto (1 a 1000 caracteres)', async () => {
    for (const [text, message] of [
      ['   ', 'validation.comment.required'],
      ['a'.repeat(1001), 'validation.comment.max'],
    ] as const) {
      const res = await t.gql(ADD_COMMENT, { postId: post.id, text }, { token: beto.token });
      expect(errorCode(res)).toBe(ErrorCode.BAD_USER_INPUT);
      expect(fieldErrors(res).text).toContain(message);
    }
  });

  it('agrega comentarios, suma el contador y no expone datos privados del autor', async () => {
    await t.gql(
      `mutation { updatePrivateContact(input: { phone: "+525500001111" }) { id } }`,
      {},
      { token: beto.token },
    );
    const res = await t.gql<{
      addComment: { id: string; text: string; viewerCanDelete: boolean; post: PostNode };
    }>(ADD_COMMENT, { postId: post.id, text: ' ¡Qué buena idea! ' }, { token: beto.token });
    expect(res.errors).toBeUndefined();
    expect(res.data!.addComment).toMatchObject({
      text: '¡Qué buena idea!',
      viewerCanDelete: true,
      post: { id: post.id, counts: { comments: 1 } },
    });
    expect(JSON.stringify(res.data)).not.toContain('+525500001111');
  });

  it('pedir datos privados del autor de un comentario no pasa la validación', async () => {
    const res = await t.gql(
      `query($postId: ID!) { postComments(postId: $postId) { edges { node { author { email } } } } }`,
      { postId: post.id },
      { token: beto.token },
    );
    expect(res.status).toBe(400);
  });

  it('pagina de lo más antiguo a lo más reciente sin repetir ni saltar', async () => {
    const texts: string[] = [];
    for (let i = 1; i <= 24; i++) {
      const author = i % 2 ? carla : beto;
      const text = `Comentario ${String(i).padStart(2, '0')}`;
      const r = await t.gql(ADD_COMMENT, { postId: post.id, text }, { token: author.token });
      expect(r.errors).toBeUndefined();
      texts.push(text);
    }
    const seen: string[] = [];
    let after: string | null = null;
    for (;;) {
      const res: {
        data: {
          postComments: {
            edges: { node: { text: string } }[];
            pageInfo: { hasNextPage: boolean; endCursor: string };
          };
        } | null;
      } = await t.gql(COMMENTS, { postId: post.id, first: 10, after }, { token: ana.token });
      const page = res.data!.postComments;
      seen.push(...page.edges.map((e) => e.node.text));
      if (!page.pageInfo.hasNextPage) break;
      after = page.pageInfo.endCursor;
    }
    expect(seen).toEqual(['¡Qué buena idea!', ...texts]);
    expect((await posts.findById(post.id).lean())!.counts.comments).toBe(25);
  });

  it('borran el autor del comentario y el autor del post; un tercero no', async () => {
    const mine = (
      await t.gql<{ addComment: { id: string } }>(
        ADD_COMMENT,
        { postId: post.id, text: 'De Carla' },
        { token: carla.token },
      )
    ).data!.addComment;
    const other = (
      await t.gql<{ addComment: { id: string } }>(
        ADD_COMMENT,
        { postId: post.id, text: 'De Beto' },
        { token: beto.token },
      )
    ).data!.addComment;
    const before = (await posts.findById(post.id).lean())!.counts.comments;

    const forbidden = await t.gql(DELETE_COMMENT, { commentId: other.id }, { token: carla.token });
    expect(errorCode(forbidden)).toBe(ErrorCode.FORBIDDEN);

    const byAuthor = await t.gql<{ deleteComment: PostNode }>(
      DELETE_COMMENT,
      { commentId: mine.id },
      { token: carla.token },
    );
    expect(byAuthor.data!.deleteComment.counts.comments).toBe(before - 1);

    const byPostAuthor = await t.gql<{ deleteComment: PostNode }>(
      DELETE_COMMENT,
      { commentId: other.id },
      { token: ana.token },
    );
    expect(byPostAuthor.data!.deleteComment.counts.comments).toBe(before - 2);

    const again = await t.gql(DELETE_COMMENT, { commentId: other.id }, { token: ana.token });
    expect(errorCode(again)).toBe(ErrorCode.NOT_FOUND);

    const list = await t.gql<{ postComments: { edges: { node: { id: string } }[] } }>(
      COMMENTS,
      { postId: post.id, first: 50 },
      { token: ana.token },
    );
    const ids = list.data!.postComments.edges.map((e) => e.node.id);
    expect(ids).not.toContain(mine.id);
    expect(ids).not.toContain(other.id);
  });

  it('viewerCanDelete refleja el permiso de cada persona', async () => {
    const res = await t.gql<{
      postComments: { edges: { node: { viewerCanDelete: boolean; author: { id: string } } }[] };
    }>(COMMENTS, { postId: post.id, first: 50 }, { token: beto.token });
    for (const { node } of res.data!.postComments.edges) {
      expect(node.viewerCanDelete).toBe(node.author.id === beto.id);
    }
    const asPostAuthor = await t.gql<{
      postComments: { edges: { node: { viewerCanDelete: boolean } }[] };
    }>(COMMENTS, { postId: post.id, first: 50 }, { token: ana.token });
    for (const { node } of asPostAuthor.data!.postComments.edges)
      expect(node.viewerCanDelete).toBe(true);
  });

  it('no se comenta un post invisible y su lista sale vacía', async () => {
    const hidden = await newPost(ana, { visibility: 'followers' });
    const res = await t.gql(
      ADD_COMMENT,
      { postId: hidden.id, text: 'hola' },
      { token: beto.token },
    );
    expect(errorCode(res)).toBe(ErrorCode.NOT_FOUND);
    const list = await t.gql<{ postComments: { edges: unknown[] } }>(
      COMMENTS,
      { postId: hidden.id },
      { token: beto.token },
    );
    expect(list.data!.postComments.edges).toEqual([]);
  });
});

describe('sharePost y notificaciones', () => {
  it('comparte, suma counts.shares, notifica por socket y el destinatario abre el post', async () => {
    const post = await newPost(ana, { title: 'Para compartir' });
    const socket = await connectSocket(await listen(t), beto.token);
    try {
      const event = nextEvent(socket, 'notification:created');
      const res = await t.gql<{ sharePost: { sentTo: number; post: PostNode } }>(
        SHARE,
        { postId: post.id, recipientIds: [beto.id, carla.id], message: 'Mira esto' },
        { token: ana.token },
      );
      expect(res.errors).toBeUndefined();
      expect(res.data!.sharePost).toMatchObject({ sentTo: 2, post: { counts: { shares: 2 } } });
      const [payload] = (await event) as [{ type: string; id: string }];
      expect(payload.type).toBe('share');
    } finally {
      socket.disconnect();
    }

    const inbox = await t.gql<{
      notifications: {
        edges: {
          node: {
            type: string;
            message: string;
            readAt: string | null;
            actor: { id: string };
            post: { id: string; title: string };
          };
        }[];
      };
      unreadNotificationsCount: number;
    }>(NOTIFICATIONS, {}, { token: beto.token });
    const n = inbox.data!.notifications.edges[0]!.node;
    expect(n).toMatchObject({
      type: 'share',
      message: 'Mira esto',
      readAt: null,
      actor: { id: ana.id },
      post: { id: post.id, title: 'Para compartir' },
    });
    expect(inbox.data!.unreadNotificationsCount).toBeGreaterThanOrEqual(1);

    const opened = await t.gql<{ post: PostNode }>(POST, { id: post.id }, { token: beto.token });
    expect(opened.data!.post.id).toBe(post.id);

    const marked = await t.gql<{ markNotificationsRead: number }>(
      `mutation { markNotificationsRead }`,
      {},
      { token: beto.token },
    );
    expect(marked.data!.markNotificationsRead).toBeGreaterThanOrEqual(1);
    const after = await t.gql<{ unreadNotificationsCount: number }>(
      NOTIFICATIONS,
      {},
      { token: beto.token },
    );
    expect(after.data!.unreadNotificationsCount).toBe(0);
  });

  it('marca como leídas solo las indicadas', async () => {
    const post = await newPost(carla);
    await t.gql(SHARE, { postId: post.id, recipientIds: [ana.id] }, { token: carla.token });
    await t.gql(SHARE, { postId: post.id, recipientIds: [ana.id] }, { token: carla.token });
    const inbox = await t.gql<{
      notifications: { edges: { node: { id: string } }[] };
      unreadNotificationsCount: number;
    }>(NOTIFICATIONS, {}, { token: ana.token });
    const unread = inbox.data!.unreadNotificationsCount;
    const firstId = inbox.data!.notifications.edges[0]!.node.id;
    const res = await t.gql<{ markNotificationsRead: number }>(
      `mutation($ids: [ID!]) { markNotificationsRead(ids: $ids) }`,
      { ids: [firstId] },
      { token: ana.token },
    );
    expect(res.data!.markNotificationsRead).toBe(1);
    const after = await t.gql<{ unreadNotificationsCount: number }>(
      NOTIFICATIONS,
      {},
      { token: ana.token },
    );
    expect(after.data!.unreadNotificationsCount).toBe(unread - 1);
  });

  it('rechaza más de 10 destinatarios, repetidos, a uno mismo y personas inexistentes', async () => {
    const post = await newPost(ana);
    const ids = Array.from({ length: 11 }, () => new Types.ObjectId().toHexString());
    const tooMany = await t.gql(
      SHARE,
      { postId: post.id, recipientIds: ids },
      { token: ana.token },
    );
    expect(fieldErrors(tooMany).recipientIds).toContain('validation.share.recipientsMax');

    const dup = await t.gql(
      SHARE,
      { postId: post.id, recipientIds: [beto.id, beto.id] },
      { token: ana.token },
    );
    expect(fieldErrors(dup).recipientIds).toContain('validation.share.recipientsDuplicate');

    for (const recipientIds of [[ana.id], [beto.id, new Types.ObjectId().toHexString()]]) {
      const res = await t.gql(SHARE, { postId: post.id, recipientIds }, { token: ana.token });
      expect(errorCode(res)).toBe(ErrorCode.BAD_USER_INPUT);
      expect(fieldErrors(res).recipientIds).toContain('validation.share.recipientsInvalid');
    }
    expect((await posts.findById(post.id).lean())!.counts.shares).toBe(0);
  });

  it('solo se comparten publicaciones públicas y visibles', async () => {
    const own = await newPost(ana, { visibility: 'followers' });
    const r1 = await t.gql(
      SHARE,
      { postId: own.id, recipientIds: [beto.id] },
      { token: ana.token },
    );
    expect(errorCode(r1)).toBe(ErrorCode.FORBIDDEN);
    const r2 = await t.gql(
      SHARE,
      { postId: own.id, recipientIds: [carla.id] },
      { token: beto.token },
    );
    expect(errorCode(r2)).toBe(ErrorCode.NOT_FOUND);
  });

  it('omite sin avisar a quien bloqueó al remitente', async () => {
    const dani = await registerUser(t, 'dani');
    const connection = t.app.get<Connection>(getConnectionToken());
    await connection.collection(BLOCKS_COLLECTION).insertOne({
      blockerId: new Types.ObjectId(dani.id),
      blockedId: new Types.ObjectId(ana.id),
      createdAt: new Date(),
    });
    const post = await newPost(ana);
    const res = await t.gql<{ sharePost: { sentTo: number; post: PostNode } }>(
      SHARE,
      { postId: post.id, recipientIds: [dani.id, carla.id] },
      { token: ana.token },
    );
    expect(res.data!.sharePost).toMatchObject({ sentTo: 1, post: { counts: { shares: 1 } } });
    const inbox = await t.gql<{ notifications: { edges: unknown[] } }>(
      NOTIFICATIONS,
      {},
      { token: dani.token },
    );
    expect(inbox.data!.notifications.edges).toEqual([]);
  });

  it('si el post se borra después, la notificación queda sin post', async () => {
    const eva = await registerUser(t, 'eva');
    const post = await newPost(carla);
    await t.gql(SHARE, { postId: post.id, recipientIds: [eva.id] }, { token: carla.token });
    await t.gql(
      `mutation($id: ID!) { deletePost(postId: $id) }`,
      { id: post.id },
      { token: carla.token },
    );
    const inbox = await t.gql<{
      notifications: { edges: { node: { post: null; actor: { id: string } } }[] };
    }>(NOTIFICATIONS, {}, { token: eva.token });
    expect(inbox.data!.notifications.edges[0]!.node).toMatchObject({
      post: null,
      actor: { id: carla.id },
    });
  });
});

describe('searchUsers (provisional)', () => {
  let ximena: TestUser;

  beforeAll(async () => {
    ximena = await registerUser(t, 'xime');
    await t.gql(
      `mutation { updateProfile(input: { displayName: "Ximena Ortega" }) { id } }`,
      {},
      { token: ximena.token },
    );
    await t.gql(
      `mutation { updatePrivateContact(input: { phone: "+525599998888", institution: "Prepa Secreta" }) { id } }`,
      {},
      { token: ximena.token },
    );
  });

  it('encuentra por prefijo del nombre, de una palabra del nombre y del handle', async () => {
    for (const query of [
      'xim',
      'Orte',
      ximena.handle.slice(0, 6),
      `@${ximena.handle.slice(0, 6)}`,
    ]) {
      const res = await t.gql<{ searchUsers: { edges: { node: { id: string } }[] } }>(
        SEARCH,
        { query },
        { token: ana.token },
      );
      expect(res.errors).toBeUndefined();
      expect(res.data!.searchUsers.edges.map((e) => e.node.id)).toContain(ximena.id);
    }
  });

  it('no expone datos privados ni permite pedirlos', async () => {
    const res = await t.gql(SEARCH, { query: 'xim' }, { token: ana.token });
    const raw = JSON.stringify(res.data);
    expect(raw).not.toContain('+525599998888');
    expect(raw).not.toContain('Prepa Secreta');
    expect(raw).not.toContain('@example.test');
    const asking = await t.gql(
      `query { searchUsers(query: "xim") { edges { node { privateContact { phone } } } } }`,
      {},
      { token: ana.token },
    );
    expect(asking.status).toBe(400);
  });

  it('trata los caracteres especiales como texto y valida la longitud', async () => {
    const regex = await t.gql<{ searchUsers: { edges: unknown[] } }>(
      SEARCH,
      { query: '.*' },
      { token: ana.token },
    );
    expect(regex.data!.searchUsers.edges).toEqual([]);
    for (const query of ['x', 'a'.repeat(81)]) {
      const res = await t.gql(SEARCH, { query }, { token: ana.token });
      expect(errorCode(res)).toBe(ErrorCode.BAD_USER_INPUT);
    }
  });

  it('pagina sin repetir', async () => {
    const seen: string[] = [];
    let after: string | null = null;
    for (;;) {
      const res: {
        data: {
          searchUsers: {
            edges: { node: { id: string } }[];
            pageInfo: { hasNextPage: boolean; endCursor: string };
          };
        } | null;
      } = await t.gql(SEARCH, { query: 'usuario', first: 2, after }, { token: ana.token });
      const page = res.data!.searchUsers;
      seen.push(...page.edges.map((e) => e.node.id));
      if (!page.pageInfo.hasNextPage) break;
      after = page.pageInfo.endCursor;
    }
    expect(seen.length).toBeGreaterThan(2);
    expect(new Set(seen).size).toBe(seen.length);
  });
});

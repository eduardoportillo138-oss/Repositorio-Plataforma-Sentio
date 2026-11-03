import { ErrorCode } from '@sentio/core';
import { createTestApp, type GqlResult, type TestApp } from './utils/test-app';

const AUTH_FIELDS = `accessToken accessTokenExpiresAt refreshToken refreshTokenExpiresAt
  user { id handle displayName email consents { privacyNoticeVersion marketingOptIn } }`;

const REGISTER = `mutation Register($input: RegisterInput!) { register(input: $input) { ${AUTH_FIELDS} } }`;
const LOGIN = `mutation Login($input: LoginInput!) { login(input: $input) { ${AUTH_FIELDS} } }`;
const REFRESH = `mutation Refresh($token: String) { refreshToken(token: $token) { ${AUTH_FIELDS} } }`;
const ME = `query Me { me { id handle email displayName } }`;
const LOGOUT = `mutation Logout { logout }`;

interface AuthPayload {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string | null;
  refreshTokenExpiresAt: string;
  user: {
    id: string;
    handle: string;
    displayName: string;
    email: string | null;
    consents: { privacyNoticeVersion: string; marketingOptIn: boolean } | null;
  };
}

const ana = {
  email: 'Ana@Example.com',
  password: 'contrasena123',
  handle: 'ana_mx',
  displayName: 'Ana',
  acceptPrivacyNotice: true,
};

function code(result: GqlResult<unknown>): string | undefined {
  return result.errors?.[0]?.extensions?.code;
}

// Una sola app por archivo: ConfigModule lee el entorno una vez por proceso.
let t: TestApp;

beforeAll(async () => {
  t = await createTestApp();
});

afterAll(async () => {
  await t?.close();
});

describe('Auth (integración): registro → login → me → refresh', () => {
  let registered: AuthPayload;
  let loggedIn: AuthPayload;

  it('registra un usuario con consentimiento y normaliza el correo', async () => {
    const res = await t.gql<{ register: AuthPayload }>(REGISTER, { input: ana });
    expect(res.errors).toBeUndefined();
    registered = res.data!.register;

    expect(registered.accessToken.split('.')).toHaveLength(3);
    expect(registered.refreshToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(registered.user).toMatchObject({
      handle: 'ana_mx',
      email: 'ana@example.com',
      consents: { privacyNoticeVersion: 'test-1', marketingOptIn: false },
    });
    const ttlMs = Date.parse(registered.accessTokenExpiresAt) - Date.now();
    expect(ttlMs).toBeGreaterThan(14 * 60 * 1000);
    expect(ttlMs).toBeLessThanOrEqual(15 * 60 * 1000);
  });

  it('rechaza el registro sin aceptar el Aviso de Privacidad', async () => {
    const res = await t.gql(REGISTER, {
      input: { ...ana, email: 'otra@example.com', handle: 'otra', acceptPrivacyNotice: false },
    });
    expect(code(res)).toBe(ErrorCode.BAD_USER_INPUT);
    expect(res.errors?.[0]?.extensions?.fieldErrors).toHaveProperty('acceptPrivacyNotice');
  });

  it('rechaza correo o handle duplicados con CONFLICT', async () => {
    const dupEmail = await t.gql(REGISTER, { input: { ...ana, handle: 'otro_handle' } });
    expect(code(dupEmail)).toBe(ErrorCode.CONFLICT);
    expect(dupEmail.errors?.[0]?.extensions?.field).toBe('email');

    const dupHandle = await t.gql(REGISTER, { input: { ...ana, email: 'nuevo@example.com' } });
    expect(code(dupHandle)).toBe(ErrorCode.CONFLICT);
    expect(dupHandle.errors?.[0]?.extensions?.field).toBe('handle');
  });

  it('inicia sesión con la contraseña correcta y falla con la incorrecta', async () => {
    const bad = await t.gql(LOGIN, { input: { email: ana.email, password: 'incorrecta1' } });
    expect(code(bad)).toBe(ErrorCode.INVALID_CREDENTIALS);

    const unknown = await t.gql(LOGIN, { input: { email: 'nadie@example.com', password: 'x' } });
    expect(code(unknown)).toBe(ErrorCode.INVALID_CREDENTIALS);

    const res = await t.gql<{ login: AuthPayload }>(LOGIN, {
      input: { email: 'ana@example.com', password: ana.password },
    });
    expect(res.errors).toBeUndefined();
    loggedIn = res.data!.login;
    expect(loggedIn.user.id).toBe(registered.user.id);
    expect(loggedIn.refreshToken).not.toBe(registered.refreshToken);
  });

  it('me exige autenticación y devuelve al usuario con un access token válido', async () => {
    const anon = await t.gql(ME);
    expect(code(anon)).toBe(ErrorCode.UNAUTHENTICATED);

    const forged = await t.gql(ME, undefined, { token: `${loggedIn.accessToken}x` });
    expect(code(forged)).toBe(ErrorCode.UNAUTHENTICATED);

    const res = await t.gql<{ me: { id: string; email: string } }>(ME, undefined, {
      token: loggedIn.accessToken,
    });
    expect(res.errors).toBeUndefined();
    expect(res.data!.me).toMatchObject({ id: registered.user.id, email: 'ana@example.com' });
  });

  it('rota el refresh token y detecta su reutilización', async () => {
    const first = await t.gql<{ refreshToken: AuthPayload }>(REFRESH, {
      token: loggedIn.refreshToken,
    });
    expect(first.errors).toBeUndefined();
    const rotated = first.data!.refreshToken;
    expect(rotated.refreshToken).not.toBe(loggedIn.refreshToken);

    const me = await t.gql<{ me: { id: string } }>(ME, undefined, { token: rotated.accessToken });
    expect(me.data!.me.id).toBe(registered.user.id);

    // Reusar el token ya canjeado revoca la sesión completa…
    const reuse = await t.gql(REFRESH, { token: loggedIn.refreshToken });
    expect(code(reuse)).toBe(ErrorCode.REFRESH_TOKEN_REUSED);

    // …así que el token vigente de esa sesión tampoco sirve ya.
    const afterRevoke = await t.gql(REFRESH, { token: rotated.refreshToken });
    expect(code(afterRevoke)).toBe(ErrorCode.REFRESH_TOKEN_INVALID);

    // Las demás sesiones del usuario (la del registro) siguen activas.
    const other = await t.gql(REFRESH, { token: registered.refreshToken });
    expect(other.errors).toBeUndefined();
  });

  it('rechaza refresh tokens inventados', async () => {
    const res = await t.gql(REFRESH, { token: 'no-es-un-token-valido' });
    expect(code(res)).toBe(ErrorCode.REFRESH_TOKEN_INVALID);
  });

  it('flujo web: refresh token en cookie httpOnly', async () => {
    const login = await t.gql<{ login: AuthPayload }>(
      LOGIN,
      { input: { email: ana.email, password: ana.password } },
      { headers: { 'x-client': 'web' } },
    );
    expect(login.data!.login.refreshToken).toBeNull();
    const setCookie = ([] as string[]).concat(login.headers['set-cookie'] ?? []);
    const cookie = setCookie.find((c) => c.startsWith('sentio_rt='));
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);

    const refreshed = await t.gql<{ refreshToken: AuthPayload }>(REFRESH, undefined, {
      headers: { 'x-client': 'web' },
      cookie: cookie!.split(';')[0],
    });
    expect(refreshed.errors).toBeUndefined();
    expect(refreshed.data!.refreshToken.refreshToken).toBeNull();
  });

  it('logout revoca la sesión: su refresh token deja de funcionar', async () => {
    const login = await t.gql<{ login: AuthPayload }>(LOGIN, {
      input: { email: ana.email, password: ana.password },
    });
    const session = login.data!.login;

    const out = await t.gql<{ logout: boolean }>(LOGOUT, undefined, { token: session.accessToken });
    expect(out.data!.logout).toBe(true);

    const res = await t.gql(REFRESH, { token: session.refreshToken });
    expect(code(res)).toBe(ErrorCode.REFRESH_TOKEN_INVALID);
  });
});

describe('Groups (integración): GroupMembershipGuard', () => {
  async function signUp(handle: string): Promise<string> {
    const res = await t.gql<{ register: AuthPayload }>(REGISTER, {
      input: { ...ana, handle, email: `${handle}@example.com` },
    });
    return res.data!.register.accessToken;
  }

  it('el owner ve los miembros; un no miembro recibe FORBIDDEN_GROUP', async () => {
    const ownerToken = await signUp('owner1');
    const strangerToken = await signUp('stranger1');

    const created = await t.gql<{
      createGroup: { id: string; visibility: string; memberCount: number };
    }>(
      `mutation { createGroup(input: { name: "Grupo Privado" }) { id visibility memberCount } }`,
      undefined,
      { token: ownerToken },
    );
    expect(created.errors).toBeUndefined();
    const group = created.data!.createGroup;
    expect(group).toMatchObject({ visibility: 'PRIVATE', memberCount: 1 });

    const MEMBERS = `query($groupId: ID!) {
      groupMembers(groupId: $groupId, first: 10) {
        edges { cursor node { role status user { handle } } }
        pageInfo { hasNextPage endCursor }
      }
    }`;

    const members = await t.gql<{
      groupMembers: {
        edges: { node: { role: string; status: string; user: { handle: string } } }[];
        pageInfo: { hasNextPage: boolean };
      };
    }>(MEMBERS, { groupId: group.id }, { token: ownerToken });
    expect(members.errors).toBeUndefined();
    expect(members.data!.groupMembers.edges).toEqual([
      expect.objectContaining({
        node: { role: 'OWNER', status: 'ACTIVE', user: { handle: 'owner1' } },
      }),
    ]);
    expect(members.data!.groupMembers.pageInfo.hasNextPage).toBe(false);

    const denied = await t.gql(MEMBERS, { groupId: group.id }, { token: strangerToken });
    expect(code(denied)).toBe(ErrorCode.FORBIDDEN_GROUP);

    const hidden = await t.gql(
      `query($id: ID!) { group(id: $id) { id } }`,
      { id: group.id },
      {
        token: strangerToken,
      },
    );
    expect(code(hidden)).toBe(ErrorCode.FORBIDDEN_GROUP);
  });
});

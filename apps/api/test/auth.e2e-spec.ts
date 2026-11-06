import { type Server } from 'node:http';
import { type AddressInfo } from 'node:net';
import { ErrorCode } from '@sentio/core';
import { createRealtimeClient, type RealtimeSocket } from '@sentio/realtime';
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

describe('Auth (integración): un access token deja de servir al revocar su sesión', () => {
  const bea = { ...ana, email: 'bea@example.com', handle: 'bea_mx', displayName: 'Bea' };
  const LOGOUT_ALL = `mutation { logout(allDevices: true) }`;

  beforeAll(async () => {
    const res = await t.gql(REGISTER, { input: bea });
    expect(res.errors).toBeUndefined();
  });

  async function login(): Promise<AuthPayload> {
    const res = await t.gql<{ login: AuthPayload }>(LOGIN, {
      input: { email: bea.email, password: bea.password },
    });
    expect(res.errors).toBeUndefined();
    return res.data!.login;
  }

  async function expectMe(accessToken: string): Promise<void> {
    const res = await t.gql<{ me: { handle: string } }>(ME, undefined, { token: accessToken });
    expect(res.errors).toBeUndefined();
    expect(res.data!.me.handle).toBe('bea_mx');
  }

  async function expectUnauthenticated(accessToken: string): Promise<void> {
    const res = await t.gql(ME, undefined, { token: accessToken });
    expect(code(res)).toBe(ErrorCode.UNAUTHENTICATED);
    expect(res.data).toBeNull();
  }

  it('tras logout, me responde UNAUTHENTICATED con el mismo access token', async () => {
    const session = await login();
    await expectMe(session.accessToken); // deja la sesión "activa" en la cache

    const out = await t.gql(LOGOUT, undefined, { token: session.accessToken });
    expect(out.errors).toBeUndefined();

    await expectUnauthenticated(session.accessToken);
  });

  it('tras logout(allDevices: true), ningún access token del usuario sirve', async () => {
    const phone = await login();
    const laptop = await login();
    await expectMe(phone.accessToken);
    await expectMe(laptop.accessToken);

    const out = await t.gql(LOGOUT_ALL, undefined, { token: phone.accessToken });
    expect(out.errors).toBeUndefined();

    await expectUnauthenticated(phone.accessToken);
    await expectUnauthenticated(laptop.accessToken);
  });

  it('tras reutilizar un refresh token, los access tokens de esa sesión dejan de servir', async () => {
    const session = await login();
    const rotated = (
      await t.gql<{ refreshToken: AuthPayload }>(REFRESH, { token: session.refreshToken })
    ).data!.refreshToken;
    await expectMe(session.accessToken);
    await expectMe(rotated.accessToken);

    const reuse = await t.gql(REFRESH, { token: session.refreshToken });
    expect(code(reuse)).toBe(ErrorCode.REFRESH_TOKEN_REUSED);

    await expectUnauthenticated(session.accessToken);
    await expectUnauthenticated(rotated.accessToken);
  });

  it('las rutas públicas tratan un token revocado como anónimo', async () => {
    const session = await login();
    await t.gql(LOGOUT, undefined, { token: session.accessToken });

    const res = await t.gql<{ login: AuthPayload }>(
      LOGIN,
      { input: { email: bea.email, password: bea.password } },
      { token: session.accessToken },
    );
    expect(res.errors).toBeUndefined();
  });

  it('Socket.IO: emite session:revoked y desconecta solo los sockets de esa sesión', async () => {
    const revokedSession = await login();
    const otherSession = await login();
    const url = await listen();

    const target = await connectSocket(url, revokedSession.accessToken);
    const bystander = await connectSocket(url, otherSession.accessToken);
    try {
      const targetEvent = nextEvent(target, 'session:revoked');
      const bystanderEvent = nextEvent(bystander, 'session:revoked');
      const targetDisconnect = nextEvent(target, 'disconnect');

      await t.gql(LOGOUT, undefined, { token: revokedSession.accessToken });

      const expected = { sessionId: sessionIdOf(revokedSession.accessToken), reason: 'logout' };
      await expect(targetEvent).resolves.toEqual([expected]);
      // El otro dispositivo también recibe el aviso (misma sala) pero sigue conectado.
      await expect(bystanderEvent).resolves.toEqual([expected]);
      await expect(targetDisconnect).resolves.toEqual(['io server disconnect']);
      expect(bystander.connected).toBe(true);
    } finally {
      target.disconnect();
      bystander.disconnect();
    }
  });

  it('Socket.IO: rechaza el handshake con un access token de una sesión revocada', async () => {
    const session = await login();
    await t.gql(LOGOUT, undefined, { token: session.accessToken });
    const url = await listen();

    const socket = createRealtimeClient({ url, getAccessToken: () => session.accessToken });
    try {
      const disconnected = nextEvent(socket, 'disconnect');
      socket.connect();
      await expect(disconnected).resolves.toEqual(['io server disconnect']);
    } finally {
      socket.disconnect();
    }
  });
});

/** Pone a escuchar la app en un puerto libre (solo una vez) y devuelve su URL base. */
async function listen(): Promise<string> {
  const server = t.app.getHttpServer() as Server;
  if (!server.listening) {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  }
  const { port } = server.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

async function connectSocket(url: string, accessToken: string): Promise<RealtimeSocket> {
  const socket = createRealtimeClient({ url, getAccessToken: () => accessToken });
  const connected = nextEvent(socket, 'connect');
  socket.connect();
  await connected;
  // El servidor une el socket a su sala después del evento connect; un ida y vuelta lo asegura.
  await new Promise((resolve) => setTimeout(resolve, 50));
  return socket;
}

function nextEvent(socket: RealtimeSocket, event: string): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout esperando "${event}"`)), 5000);
    (socket as unknown as { once: (e: string, cb: (...a: unknown[]) => void) => void }).once(
      event,
      (...args: unknown[]) => {
        clearTimeout(timer);
        resolve(args);
      },
    );
  });
}

function sessionIdOf(accessToken: string): string {
  const payload = JSON.parse(
    Buffer.from(accessToken.split('.')[1]!, 'base64url').toString('utf8'),
  ) as { sid: string };
  return payload.sid;
}

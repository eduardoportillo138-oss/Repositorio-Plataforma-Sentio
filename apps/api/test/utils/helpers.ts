import { type Server } from 'node:http';
import { type AddressInfo } from 'node:net';
import { createRealtimeClient, type RealtimeSocket } from '@sentio/realtime';
import { type GqlResult, type TestApp } from './test-app';

export interface TestUser {
  id: string;
  handle: string;
  token: string;
}

const REGISTER = `mutation Register($input: RegisterInput!) {
  register(input: $input) { accessToken user { id handle } }
}`;

let counter = 0;

/** Registra un usuario con datos únicos y devuelve su id, handle y access token. */
export async function registerUser(t: TestApp, prefix = 'user'): Promise<TestUser> {
  counter += 1;
  const handle = `${prefix}_${Date.now().toString(36)}_${counter}`.slice(0, 30);
  const res = await t.gql<{
    register: { accessToken: string; user: { id: string; handle: string } };
  }>(REGISTER, {
    input: {
      email: `${handle}@example.test`,
      password: 'contrasena123',
      handle,
      displayName: `Usuario ${counter}`,
      acceptPrivacyNotice: true,
    },
  });
  if (!res.data) throw new Error(`No se pudo registrar: ${JSON.stringify(res.errors)}`);
  return {
    id: res.data.register.user.id,
    handle: res.data.register.user.handle,
    token: res.data.register.accessToken,
  };
}

export function errorCode(result: GqlResult<unknown>): string | undefined {
  return result.errors?.[0]?.extensions?.code;
}

export function fieldErrors(result: GqlResult<unknown>): Record<string, string[]> {
  return (result.errors?.[0]?.extensions?.fieldErrors as Record<string, string[]>) ?? {};
}

/** Pone a escuchar la app en un puerto libre (solo una vez) y devuelve su URL base. */
export async function listen(t: TestApp): Promise<string> {
  const server = t.app.getHttpServer() as Server;
  if (!server.listening) {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  }
  const { port } = server.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

export function nextEvent(socket: RealtimeSocket, event: string, timeoutMs = 5000) {
  return new Promise<unknown[]>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout esperando "${event}"`)), timeoutMs);
    (socket as unknown as { once: (e: string, cb: (...a: unknown[]) => void) => void }).once(
      event,
      (...args: unknown[]) => {
        clearTimeout(timer);
        resolve(args);
      },
    );
  });
}

export async function connectSocket(url: string, accessToken: string): Promise<RealtimeSocket> {
  const socket = createRealtimeClient({ url, getAccessToken: () => accessToken });
  const connected = nextEvent(socket, 'connect');
  socket.connect();
  await connected;
  // El servidor une el socket a su sala después del evento connect; un ida y vuelta lo asegura.
  await new Promise((resolve) => setTimeout(resolve, 50));
  return socket;
}

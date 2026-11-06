import { ErrorCode } from '@sentio/core';
import { type Model, Types } from 'mongoose';
import { type Session } from './schemas/session.schema';
import { MemorySessionActivityCache } from './session-activity.cache';
import { SessionEvents, type SessionsRevokedEvent } from './session-events';
import { SessionsService } from './sessions.service';
import { makeTokensService } from './test-helpers';

/**
 * Modelo de Mongoose falso en memoria con la semántica justa que usa SessionsService
 * (findOneAndUpdate atómico, $push con $slice y búsqueda en previousTokenHashes).
 */
function fakeSessionModel() {
  const docs: Session[] = [];

  const matches = (doc: Session, filter: Record<string, unknown>): boolean =>
    Object.entries(filter).every(([key, cond]) => {
      if (key === 'previousTokenHashes') return doc.previousTokenHashes.includes(cond as string);
      if (key === '_id') return doc._id.equals(cond as string);
      const value = (doc as unknown as Record<string, unknown>)[key];
      if (cond && typeof cond === 'object' && '$gt' in cond) {
        return (value as Date) > (cond as { $gt: Date }).$gt;
      }
      if (cond instanceof Types.ObjectId) return (value as Types.ObjectId).equals(cond);
      return value === cond;
    });

  const exec = <T>(value: T) => ({
    lean: () => ({ exec: () => Promise.resolve(value) }),
    exec: () => Promise.resolve(value),
  });

  const model = {
    docs,
    create: (data: Partial<Session>) => {
      const doc = {
        _id: new Types.ObjectId(),
        previousTokenHashes: [],
        revokedAt: null,
        revokedReason: null,
        lastRotatedAt: null,
        ...data,
      } as Session;
      docs.push(doc);
      return Promise.resolve(doc);
    },
    findOneAndUpdate: (
      filter: Record<string, unknown>,
      update: {
        $set: Partial<Session>;
        $push?: { previousTokenHashes: { $each: string[]; $slice: number } };
      },
    ) => {
      const doc = docs.find((d) => matches(d, filter));
      if (doc) {
        Object.assign(doc, update.$set);
        if (update.$push) {
          const { $each, $slice } = update.$push.previousTokenHashes;
          doc.previousTokenHashes = [...doc.previousTokenHashes, ...$each].slice($slice);
        }
      }
      return exec(doc ? { ...doc } : null);
    },
    exists: (filter: Record<string, unknown>) =>
      Promise.resolve(docs.find((d) => matches(d, filter)) ? { _id: 1 } : null),
    updateOne: (filter: Record<string, unknown>, update: { $set: Partial<Session> }) => {
      const doc = docs.find((d) => matches(d, filter));
      if (doc) Object.assign(doc, update.$set);
      return exec({ modifiedCount: doc ? 1 : 0 });
    },
    updateMany: (filter: Record<string, unknown>, update: { $set: Partial<Session> }) => {
      const found = docs.filter((d) => matches(d, filter));
      found.forEach((d) => Object.assign(d, update.$set));
      return exec({ modifiedCount: found.length });
    },
    find: (filter: Record<string, unknown>) =>
      exec(docs.filter((d) => matches(d, filter)).map((d) => ({ _id: d._id }))),
  };
  return model;
}

const meta = { ip: '127.0.0.1', userAgent: 'jest' };
const userId = new Types.ObjectId().toHexString();

async function expectCode(promise: Promise<unknown>, code: string): Promise<void> {
  await expect(promise).rejects.toMatchObject({ extensions: { code } });
}

describe('SessionsService', () => {
  let model: ReturnType<typeof fakeSessionModel>;
  let sessions: SessionsService;
  let cache: MemorySessionActivityCache;
  let revokedEvents: SessionsRevokedEvent[];
  const tokens = makeTokensService();

  beforeEach(() => {
    model = fakeSessionModel();
    cache = new MemorySessionActivityCache();
    const events = new SessionEvents();
    revokedEvents = [];
    events.revoked$.subscribe((e) => revokedEvents.push(e));
    sessions = new SessionsService(model as unknown as Model<Session>, tokens, cache, events);
  });

  it('guarda solo el hash del refresh token, nunca el token en claro', async () => {
    const issued = await sessions.create(userId, meta);
    const stored = model.docs[0]!;
    expect(stored.tokenHash).toBe(tokens.hashRefreshToken(issued.refreshToken));
    expect(JSON.stringify(stored)).not.toContain(issued.refreshToken);
  });

  it('rota: el token nuevo funciona y el viejo pasa al historial', async () => {
    const first = await sessions.create(userId, meta);
    const second = await sessions.rotate(first.refreshToken, meta);

    expect(second.sessionId).toBe(first.sessionId);
    expect(second.refreshToken).not.toBe(first.refreshToken);
    expect(model.docs[0]!.previousTokenHashes).toEqual([
      tokens.hashRefreshToken(first.refreshToken),
    ]);

    const third = await sessions.rotate(second.refreshToken, meta);
    expect(third.userId).toBe(userId);
  });

  it('detecta la reutilización de un token rotado y revoca la sesión', async () => {
    const first = await sessions.create(userId, meta);
    const second = await sessions.rotate(first.refreshToken, meta);

    await expectCode(sessions.rotate(first.refreshToken, meta), ErrorCode.REFRESH_TOKEN_REUSED);
    expect(model.docs[0]).toMatchObject({ revokedReason: 'reuse_detected' });
    expect(model.docs[0]!.revokedAt).toBeInstanceOf(Date);

    // El token vigente de la sesión comprometida ya no sirve.
    await expectCode(sessions.rotate(second.refreshToken, meta), ErrorCode.REFRESH_TOKEN_INVALID);
    // Y repetir el token viejo sigue contando como reutilización.
    await expectCode(sessions.rotate(first.refreshToken, meta), ErrorCode.REFRESH_TOKEN_REUSED);
  });

  it('rechaza tokens desconocidos, revocados o vencidos', async () => {
    await expectCode(sessions.rotate('desconocido', meta), ErrorCode.REFRESH_TOKEN_INVALID);

    const revoked = await sessions.create(userId, meta);
    await sessions.revoke(revoked.sessionId);
    await expectCode(sessions.rotate(revoked.refreshToken, meta), ErrorCode.REFRESH_TOKEN_INVALID);

    const expired = await sessions.create(userId, meta);
    model.docs.at(-1)!.expiresAt = new Date(Date.now() - 1000);
    await expectCode(sessions.rotate(expired.refreshToken, meta), ErrorCode.REFRESH_TOKEN_INVALID);
  });

  it('isActive refleja revocación', async () => {
    const issued = await sessions.create(userId, meta);
    await expect(sessions.isActive(issued.sessionId)).resolves.toBe(true);
    await sessions.revoke(issued.sessionId);
    await expect(sessions.isActive(issued.sessionId)).resolves.toBe(false);
  });

  it('revokeAllForUser cierra todas las sesiones del usuario', async () => {
    const a = await sessions.create(userId, meta);
    const b = await sessions.create(userId, meta);
    const otherUser = await sessions.create(new Types.ObjectId().toHexString(), meta);
    await Promise.all([a, b, otherUser].map((s) => sessions.isActive(s.sessionId)));

    await expect(sessions.revokeAllForUser(userId)).resolves.toBe(2);
    expect(model.docs.filter((d) => d.revokedReason === 'logout_all')).toHaveLength(2);

    await expect(cache.get(a.sessionId)).resolves.toBe(false);
    await expect(cache.get(b.sessionId)).resolves.toBe(false);
    await expect(sessions.isActive(otherUser.sessionId)).resolves.toBe(true);
    expect(revokedEvents).toEqual([
      { userId, sessionIds: [a.sessionId, b.sessionId], reason: 'logout_all' },
    ]);
  });

  it('revokeAllForUser sin sesiones activas no emite eventos', async () => {
    await expect(sessions.revokeAllForUser(userId)).resolves.toBe(0);
    expect(revokedEvents).toEqual([]);
  });

  describe('cache de isActive', () => {
    it('cachea el resultado y no vuelve a consultar la BD dentro del TTL', async () => {
      const issued = await sessions.create(userId, meta);
      const exists = jest.spyOn(model, 'exists');

      await expect(sessions.isActive(issued.sessionId)).resolves.toBe(true);
      await expect(sessions.isActive(issued.sessionId)).resolves.toBe(true);
      expect(exists).toHaveBeenCalledTimes(1);
    });

    it('revoke sobrescribe la cache al momento y emite el evento', async () => {
      const issued = await sessions.create(userId, meta);
      await sessions.isActive(issued.sessionId); // queda "activa" en cache

      await sessions.revoke(issued.sessionId, 'logout');
      await expect(sessions.isActive(issued.sessionId)).resolves.toBe(false);
      expect(revokedEvents).toEqual([{ userId, sessionIds: [issued.sessionId], reason: 'logout' }]);

      // Revocar de nuevo no repite el evento.
      await sessions.revoke(issued.sessionId, 'logout');
      expect(revokedEvents).toHaveLength(1);
    });

    it('un "activa" que llega tarde no pisa una revocación', async () => {
      const issued = await sessions.create(userId, meta);
      await sessions.revoke(issued.sessionId);
      // Simula una petición que leyó la BD antes de la revocación y escribe después.
      await cache.markActive(issued.sessionId);
      await expect(sessions.isActive(issued.sessionId)).resolves.toBe(false);
    });

    it('la reutilización de refresh token invalida la cache y emite el evento', async () => {
      const first = await sessions.create(userId, meta);
      await sessions.rotate(first.refreshToken, meta);
      await expect(sessions.isActive(first.sessionId)).resolves.toBe(true);

      await expectCode(sessions.rotate(first.refreshToken, meta), ErrorCode.REFRESH_TOKEN_REUSED);
      await expect(sessions.isActive(first.sessionId)).resolves.toBe(false);
      expect(revokedEvents).toEqual([
        { userId, sessionIds: [first.sessionId], reason: 'reuse_detected' },
      ]);
    });

    it('ids inválidos no llegan a la BD', async () => {
      const exists = jest.spyOn(model, 'exists');
      await expect(sessions.isActive('no-es-un-id')).resolves.toBe(false);
      await sessions.revoke('no-es-un-id');
      expect(exists).not.toHaveBeenCalled();
    });
  });
});

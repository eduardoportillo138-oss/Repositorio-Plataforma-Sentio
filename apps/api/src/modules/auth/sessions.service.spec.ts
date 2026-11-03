import { ErrorCode } from '@sentio/core';
import { type Model, Types } from 'mongoose';
import { type Session } from './schemas/session.schema';
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
  const tokens = makeTokensService();

  beforeEach(() => {
    model = fakeSessionModel();
    sessions = new SessionsService(model as unknown as Model<Session>, tokens);
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
    await sessions.create(userId, meta);
    await sessions.create(userId, meta);
    await expect(sessions.revokeAllForUser(userId)).resolves.toBe(2);
    expect(model.docs.every((d) => d.revokedReason === 'logout_all')).toBe(true);
  });
});

import { ErrorCode } from '@sentio/core';
import { GraphQLError } from 'graphql';
import { decodeCursor, encodeCursor } from './cursor';

describe('cursor opaco', () => {
  it('codifica y decodifica sin perder información', () => {
    const payload = { key: 1_767_225_600_000, id: '65f000000000000000000001' };
    const cursor = encodeCursor(payload);
    expect(cursor).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeCursor(cursor)).toEqual(payload);
  });

  it.each(['basura', Buffer.from('["v0",1,"x"]').toString('base64url'), ''])(
    'rechaza cursores inválidos (%s)',
    (cursor) => {
      let thrown: unknown;
      try {
        decodeCursor(cursor);
      } catch (error) {
        thrown = error;
      }
      expect(thrown).toBeInstanceOf(GraphQLError);
      expect((thrown as GraphQLError).extensions.code).toBe(ErrorCode.BAD_USER_INPUT);
    },
  );
});

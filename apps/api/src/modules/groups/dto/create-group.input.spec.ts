import { createGroupSchema } from './create-group.input';

describe('createGroupSchema', () => {
  it.each([
    ['public', 'open'],
    ['private', 'request'],
    ['secret', 'invite_only'],
  ] as const)('visibilidad %s → joinPolicy por defecto %s', (visibility, joinPolicy) => {
    expect(createGroupSchema.parse({ name: 'Mi grupo', visibility })).toMatchObject({
      visibility,
      joinPolicy,
    });
  });

  it('sin visibilidad crea un grupo privado con ingreso por solicitud', () => {
    expect(createGroupSchema.parse({ name: 'Mi grupo' })).toMatchObject({
      visibility: 'private',
      joinPolicy: 'request',
    });
  });

  it.each(['request', 'open'] as const)('rechaza un grupo secreto con joinPolicy %s', (policy) => {
    const result = createGroupSchema.safeParse({
      name: 'Mi grupo',
      visibility: 'secret',
      joinPolicy: policy,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['joinPolicy']);
  });

  it('respeta una política explícita admitida', () => {
    expect(
      createGroupSchema.parse({
        name: 'Mi grupo',
        visibility: 'private',
        joinPolicy: 'invite_only',
      }),
    ).toMatchObject({ joinPolicy: 'invite_only' });
  });
});

import { createPostSchema, POST_TEXT_MAX_LENGTH, POST_TITLE_MAX_LENGTH } from './post';

const firstMessage = (value: unknown) => {
  const r = createPostSchema.safeParse(value);
  return r.success ? null : (r.error.issues[0]?.message ?? null);
};

describe('createPostSchema', () => {
  it('acepta título y descripción, recorta espacios y usa public por defecto', () => {
    expect(createPostSchema.parse({ title: '  Hola  ', text: '  Mundo ' })).toEqual({
      title: 'Hola',
      text: 'Mundo',
      visibility: 'public',
    });
  });

  it('la descripción es opcional', () => {
    expect(createPostSchema.parse({ title: 'Solo título' })).toEqual({
      title: 'Solo título',
      text: '',
      visibility: 'public',
    });
  });

  it('acepta la visibilidad followers', () => {
    expect(createPostSchema.parse({ title: 'x', visibility: 'followers' }).visibility).toBe(
      'followers',
    );
  });

  it('exige un título no vacío', () => {
    expect(firstMessage({ title: '   ' })).toBe('validation.post.titleRequired');
    expect(firstMessage({})).not.toBeNull();
  });

  it(`limita el título a ${POST_TITLE_MAX_LENGTH} caracteres`, () => {
    expect(createPostSchema.safeParse({ title: 'a'.repeat(POST_TITLE_MAX_LENGTH) }).success).toBe(
      true,
    );
    expect(firstMessage({ title: 'a'.repeat(POST_TITLE_MAX_LENGTH + 1) })).toBe(
      'validation.post.titleMax',
    );
  });

  it(`limita la descripción a ${POST_TEXT_MAX_LENGTH} caracteres`, () => {
    expect(
      createPostSchema.safeParse({ title: 'x', text: 'a'.repeat(POST_TEXT_MAX_LENGTH) }).success,
    ).toBe(true);
    expect(firstMessage({ title: 'x', text: 'a'.repeat(POST_TEXT_MAX_LENGTH + 1) })).toBe(
      'validation.post.textMax',
    );
  });

  it('rechaza visibilidades no permitidas y campos desconocidos', () => {
    expect(firstMessage({ title: 'x', visibility: 'group' })).toBe('validation.post.visibility');
    expect(createPostSchema.safeParse({ title: 'x', groupId: 'g' }).success).toBe(false);
  });
});

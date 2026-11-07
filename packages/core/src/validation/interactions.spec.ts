import { addCommentSchema, COMMENT_MAX_LENGTH, sharePostSchema } from './interactions';
import { escapeRegex, normalizeSearchText, searchQuerySchema } from './search';

const ID = '507f1f77bcf86cd799439011';
const ids = (n: number) =>
  Array.from({ length: n }, (_, i) => `507f1f77bcf86cd7994390${String(i).padStart(2, '0')}`);
const msg = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  r.success ? null : (r.error?.issues[0]?.message ?? null);

describe('addCommentSchema', () => {
  it('acepta de 1 a 1000 caracteres y recorta', () => {
    expect(addCommentSchema.parse({ postId: ID, text: '  hola ' })).toEqual({
      postId: ID,
      text: 'hola',
    });
    expect(
      addCommentSchema.safeParse({ postId: ID, text: 'a'.repeat(COMMENT_MAX_LENGTH) }).success,
    ).toBe(true);
  });

  it('rechaza vacío y más de 1000', () => {
    expect(msg(addCommentSchema.safeParse({ postId: ID, text: '   ' }))).toBe(
      'validation.comment.required',
    );
    expect(msg(addCommentSchema.safeParse({ postId: ID, text: 'a'.repeat(1001) }))).toBe(
      'validation.comment.max',
    );
  });

  it('valida el id del post', () => {
    expect(msg(addCommentSchema.safeParse({ postId: 'x', text: 'hola' }))).toBe('validation.id');
  });
});

describe('sharePostSchema', () => {
  it('acepta de 1 a 10 destinatarios y mensaje opcional', () => {
    expect(sharePostSchema.parse({ postId: ID, recipientIds: ids(10) }).recipientIds).toHaveLength(
      10,
    );
    expect(sharePostSchema.parse({ postId: ID, recipientIds: ids(1), message: ' hola ' })).toEqual({
      postId: ID,
      recipientIds: ids(1),
      message: 'hola',
    });
  });

  it('un mensaje vacío equivale a ninguno', () => {
    expect(sharePostSchema.parse({ postId: ID, recipientIds: ids(1), message: '  ' }).message).toBe(
      null,
    );
  });

  it('rechaza 0 u 11 destinatarios, repetidos e ids inválidos', () => {
    expect(msg(sharePostSchema.safeParse({ postId: ID, recipientIds: [] }))).toBe(
      'validation.share.recipientsRequired',
    );
    expect(msg(sharePostSchema.safeParse({ postId: ID, recipientIds: ids(11) }))).toBe(
      'validation.share.recipientsMax',
    );
    expect(
      msg(sharePostSchema.safeParse({ postId: ID, recipientIds: [ID, ID.toUpperCase()] })),
    ).toBe('validation.share.recipientsDuplicate');
    expect(msg(sharePostSchema.safeParse({ postId: ID, recipientIds: ['nope'] }))).toBe(
      'validation.id',
    );
  });

  it('limita el mensaje a 500 caracteres', () => {
    expect(
      msg(
        sharePostSchema.safeParse({ postId: ID, recipientIds: ids(1), message: 'a'.repeat(501) }),
      ),
    ).toBe('validation.share.messageMax');
  });
});

describe('búsqueda', () => {
  it('normaliza minúsculas, acentos y espacios', () => {
    expect(normalizeSearchText('  José   MUÑOZ  ')).toBe('jose munoz');
    expect(normalizeSearchText('Ärger Çedilla')).toBe('arger cedilla');
  });

  it('escapa caracteres especiales de regex', () => {
    expect(escapeRegex('a.b*c(d)[e]$^+?{}|\\')).toBe(
      'a\\.b\\*c\\(d\\)\\[e\\]\\$\\^\\+\\?\\{\\}\\|\\\\',
    );
    expect(new RegExp(escapeRegex('.*')).test('abc')).toBe(false);
  });

  it('searchQuerySchema exige de 2 a 80 caracteres y devuelve el texto normalizado', () => {
    expect(searchQuerySchema.parse('  Ána ')).toBe('ana');
    expect(msg(searchQuerySchema.safeParse('a'))).toBe('validation.search.min');
    expect(msg(searchQuerySchema.safeParse('a'.repeat(81)))).toBe('validation.search.max');
    // Un acento suelto normalizado queda vacío.
    expect(msg(searchQuerySchema.safeParse(' ́́ '))).toBe('validation.search.min');
  });
});

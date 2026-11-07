import { isProfileQuality, MAX_PROFILE_TAGS, PROFILE_QUALITIES, tagsSchema } from './qualities';

const messages = (value: unknown) => {
  const r = tagsSchema.safeParse(value);
  return r.success ? [] : r.error.issues.map((i) => i.message);
};

describe('catálogo de cualidades', () => {
  it('tiene 10 claves únicas en formato estable', () => {
    expect(PROFILE_QUALITIES).toHaveLength(10);
    expect(new Set(PROFILE_QUALITIES).size).toBe(10);
    for (const key of PROFILE_QUALITIES) expect(key).toMatch(/^[a-z]+$/);
  });

  it('isProfileQuality reconoce solo claves del catálogo', () => {
    expect(isProfileQuality('creative')).toBe(true);
    expect(isProfileQuality('Creative')).toBe(false);
    expect(isProfileQuality(42)).toBe(false);
  });
});

describe('tagsSchema', () => {
  it('acepta de 0 a 3 cualidades del catálogo', () => {
    expect(tagsSchema.parse([])).toEqual([]);
    expect(tagsSchema.parse(['calm'])).toEqual(['calm']);
    expect(tagsSchema.parse(['calm', 'curious', 'creative'])).toHaveLength(MAX_PROFILE_TAGS);
  });

  it('rechaza más de 3', () => {
    expect(messages(['calm', 'curious', 'creative', 'organized'])).toContain('validation.tags.max');
  });

  it('rechaza claves fuera del catálogo', () => {
    expect(messages(['calm', 'lazy'])).toContain('validation.tags.unknown');
  });

  it('rechaza repetidas', () => {
    expect(messages(['calm', 'calm'])).toContain('validation.tags.duplicate');
  });

  it('rechaza valores que no son arreglo', () => {
    expect(tagsSchema.safeParse('calm').success).toBe(false);
  });
});

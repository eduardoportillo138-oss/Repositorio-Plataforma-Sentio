import { AVATAR_MAX_BYTES, avatarUploadSchema, objectIdSchema } from './media';
import { BIO_MAX_LENGTH, privateContactSchema, updateProfileSchema } from './user';

const firstMessage = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  r.success ? null : (r.error?.issues[0]?.message ?? null);

describe('updateProfileSchema', () => {
  it('acepta nombre, biografía y etiquetas', () => {
    expect(
      updateProfileSchema.parse({ displayName: ' Ana ', bio: ' Hola ', tags: ['calm'] }),
    ).toEqual({ displayName: 'Ana', bio: 'Hola', tags: ['calm'] });
  });

  it('permite borrar la biografía con null', () => {
    expect(updateProfileSchema.parse({ bio: null })).toEqual({ bio: null });
  });

  it(`limita la biografía a ${BIO_MAX_LENGTH} caracteres`, () => {
    expect(updateProfileSchema.safeParse({ bio: 'a'.repeat(BIO_MAX_LENGTH) }).success).toBe(true);
    expect(
      firstMessage(updateProfileSchema.safeParse({ bio: 'a'.repeat(BIO_MAX_LENGTH + 1) })),
    ).toBe('validation.bio.max');
  });

  it('valida las etiquetas con el catálogo', () => {
    expect(firstMessage(updateProfileSchema.safeParse({ tags: ['x'] }))).toBe(
      'validation.tags.unknown',
    );
  });

  it('rechaza campos desconocidos (avatarUrl ya no se edita aquí)', () => {
    expect(updateProfileSchema.safeParse({ avatarUrl: 'https://x.test/a.png' }).success).toBe(
      false,
    );
  });

  it('rechaza un nombre vacío', () => {
    expect(firstMessage(updateProfileSchema.safeParse({ displayName: '   ' }))).toBe(
      'validation.displayName.required',
    );
  });
});

describe('privateContactSchema', () => {
  it('acepta todos los campos válidos y normaliza', () => {
    expect(
      privateContactSchema.parse({
        phone: '+52 (55) 1234-5678',
        altEmail: ' Ana@Example.COM ',
        institution: 'UNAM',
        studentId: 'A0123',
        emergencyContactName: 'Rosa',
        emergencyContactPhone: '+525598765432',
      }),
    ).toEqual({
      phone: '+525512345678',
      altEmail: 'ana@example.com',
      institution: 'UNAM',
      studentId: 'A0123',
      emergencyContactName: 'Rosa',
      emergencyContactPhone: '+525598765432',
    });
  });

  it('todos los campos son opcionales', () => {
    expect(privateContactSchema.parse({})).toEqual({});
  });

  it('convierte cadenas vacías en null para borrar', () => {
    expect(privateContactSchema.parse({ phone: '  ', institution: '' })).toEqual({
      phone: null,
      institution: null,
    });
  });

  it('exige teléfonos en formato E.164', () => {
    expect(firstMessage(privateContactSchema.safeParse({ phone: '5512345678' }))).toBe(
      'validation.phone.format',
    );
    expect(firstMessage(privateContactSchema.safeParse({ emergencyContactPhone: '+0123' }))).toBe(
      'validation.phone.format',
    );
  });

  it('valida el correo alterno', () => {
    expect(firstMessage(privateContactSchema.safeParse({ altEmail: 'no-es-correo' }))).toBe(
      'validation.email.invalid',
    );
  });

  it('limita la longitud de los textos', () => {
    expect(firstMessage(privateContactSchema.safeParse({ institution: 'a'.repeat(121) }))).toBe(
      'validation.institution.max',
    );
    expect(firstMessage(privateContactSchema.safeParse({ studentId: 'a'.repeat(41) }))).toBe(
      'validation.studentId.max',
    );
    expect(
      firstMessage(privateContactSchema.safeParse({ emergencyContactName: 'a'.repeat(81) })),
    ).toBe('validation.emergencyContactName.max');
  });

  it('rechaza campos desconocidos', () => {
    expect(privateContactSchema.safeParse({ address: 'x' }).success).toBe(false);
  });
});

describe('avatarUploadSchema', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp', 'image/heic'])('acepta %s', (mimeType) => {
    expect(avatarUploadSchema.safeParse({ mimeType, sizeBytes: 1000 }).success).toBe(true);
  });

  it('rechaza otros tipos', () => {
    expect(
      firstMessage(avatarUploadSchema.safeParse({ mimeType: 'image/gif', sizeBytes: 1 })),
    ).toBe('validation.avatar.type');
  });

  it('acepta hasta 5 MB y rechaza más', () => {
    expect(
      avatarUploadSchema.safeParse({ mimeType: 'image/png', sizeBytes: AVATAR_MAX_BYTES }).success,
    ).toBe(true);
    expect(
      firstMessage(
        avatarUploadSchema.safeParse({ mimeType: 'image/png', sizeBytes: AVATAR_MAX_BYTES + 1 }),
      ),
    ).toBe('validation.avatar.size');
  });

  it('rechaza tamaño cero', () => {
    expect(
      firstMessage(avatarUploadSchema.safeParse({ mimeType: 'image/png', sizeBytes: 0 })),
    ).toBe('validation.avatar.empty');
  });
});

describe('objectIdSchema', () => {
  it('valida ids de MongoDB', () => {
    expect(objectIdSchema.safeParse('507f1f77bcf86cd799439011').success).toBe(true);
    expect(objectIdSchema.safeParse('nope').success).toBe(false);
  });
});

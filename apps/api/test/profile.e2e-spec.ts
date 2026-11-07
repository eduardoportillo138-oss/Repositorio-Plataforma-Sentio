import { ErrorCode, PROFILE_QUALITIES } from '@sentio/core';
import { errorCode, fieldErrors, registerUser, type TestUser } from './utils/helpers';
import { createTestApp, type TestApp } from './utils/test-app';

const PROFILE_FIELDS = `id handle displayName bio tags email
  avatar { url256 url512 blurhash }
  consents { privacyNoticeVersion }
  privateContact { phone altEmail institution studentId emergencyContactName emergencyContactPhone }`;

const USER = `query User($handle: String!) { user(handle: $handle) { ${PROFILE_FIELDS} } }`;
const ME = `query Me { me { ${PROFILE_FIELDS} } }`;
const QUALITIES = `query { profileQualities { key } }`;
const UPDATE_PROFILE = `mutation($input: UpdateProfileInput!) {
  updateProfile(input: $input) { ${PROFILE_FIELDS} }
}`;
const UPDATE_CONTACT = `mutation($input: UpdatePrivateContactInput!) {
  updatePrivateContact(input: $input) { ${PROFILE_FIELDS} }
}`;

interface Profile {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  tags: string[];
  email: string | null;
  avatar: { url256: string; url512: string; blurhash: string } | null;
  consents: { privacyNoticeVersion: string } | null;
  privateContact: Record<string, string | null> | null;
}

const CONTACT = {
  phone: '+525512345678',
  altEmail: 'otro@example.test',
  institution: 'UNAM',
  studentId: 'A01234',
  emergencyContactName: 'Rosa',
  emergencyContactPhone: '+525598765432',
};

let t: TestApp;
let ana: TestUser;
let beto: TestUser;

beforeAll(async () => {
  t = await createTestApp();
  ana = await registerUser(t, 'ana');
  beto = await registerUser(t, 'beto');
});

afterAll(async () => {
  await t?.close();
});

describe('profileQualities', () => {
  it('devuelve el catálogo de core, también sin sesión', async () => {
    const res = await t.gql<{ profileQualities: { key: string }[] }>(QUALITIES);
    expect(res.errors).toBeUndefined();
    expect(res.data!.profileQualities.map((q) => q.key)).toEqual([...PROFILE_QUALITIES]);
  });
});

describe('updateProfile', () => {
  it('actualiza nombre, biografía y etiquetas', async () => {
    const res = await t.gql<{ updateProfile: Profile }>(
      UPDATE_PROFILE,
      {
        input: { displayName: ' Ana López ', bio: 'Estudio biología.', tags: ['curious', 'calm'] },
      },
      { token: ana.token },
    );
    expect(res.errors).toBeUndefined();
    expect(res.data!.updateProfile).toMatchObject({
      displayName: 'Ana López',
      bio: 'Estudio biología.',
      tags: ['curious', 'calm'],
    });
  });

  it('borra la biografía con null y conserva lo demás', async () => {
    const res = await t.gql<{ updateProfile: Profile }>(
      UPDATE_PROFILE,
      { input: { bio: null } },
      { token: ana.token },
    );
    expect(res.data!.updateProfile.bio).toBeNull();
    expect(res.data!.updateProfile.tags).toEqual(['curious', 'calm']);
  });

  it.each([
    [
      'más de 3 etiquetas',
      { tags: ['calm', 'curious', 'creative', 'organized'] },
      'tags',
      'validation.tags.max',
    ],
    ['una etiqueta fuera del catálogo', { tags: ['lazy'] }, 'tags.0', 'validation.tags.unknown'],
    ['etiquetas repetidas', { tags: ['calm', 'calm'] }, 'tags', 'validation.tags.duplicate'],
    ['biografía de más de 300', { bio: 'a'.repeat(301) }, 'bio', 'validation.bio.max'],
  ])('rechaza %s', async (_name, input, field, message) => {
    const res = await t.gql(UPDATE_PROFILE, { input }, { token: ana.token });
    expect(errorCode(res)).toBe(ErrorCode.BAD_USER_INPUT);
    expect(fieldErrors(res)[field]).toContain(message);
  });

  it('rechaza avatarUrl: la foto solo cambia con requestAvatarUpload', async () => {
    const res = await t.gql(
      UPDATE_PROFILE,
      { input: { avatarUrl: 'https://x.test/a.png' } },
      { token: ana.token },
    );
    expect(res.errors).toBeDefined();
  });

  it('exige sesión', async () => {
    const res = await t.gql(UPDATE_PROFILE, { input: { bio: 'x' } });
    expect(errorCode(res)).toBe(ErrorCode.UNAUTHENTICATED);
  });
});

describe('updatePrivateContact', () => {
  it('guarda los datos de contacto del propio usuario', async () => {
    const res = await t.gql<{ updatePrivateContact: Profile }>(
      UPDATE_CONTACT,
      { input: CONTACT },
      { token: ana.token },
    );
    expect(res.errors).toBeUndefined();
    expect(res.data!.updatePrivateContact.privateContact).toEqual(CONTACT);
  });

  it('solo cambia los campos enviados y borra con cadena vacía', async () => {
    const res = await t.gql<{ updatePrivateContact: Profile }>(
      UPDATE_CONTACT,
      { input: { studentId: '', institution: 'IPN' } },
      { token: ana.token },
    );
    expect(res.data!.updatePrivateContact.privateContact).toEqual({
      ...CONTACT,
      studentId: null,
      institution: 'IPN',
    });
  });

  it('rechaza un teléfono que no está en E.164', async () => {
    const res = await t.gql(
      UPDATE_CONTACT,
      { input: { phone: '5512345678' } },
      { token: ana.token },
    );
    expect(errorCode(res)).toBe(ErrorCode.BAD_USER_INPUT);
    expect(fieldErrors(res).phone).toContain('validation.phone.format');
  });

  it('rechaza un correo alterno inválido', async () => {
    const res = await t.gql(UPDATE_CONTACT, { input: { altEmail: 'nope' } }, { token: ana.token });
    expect(fieldErrors(res).altEmail).toContain('validation.email.invalid');
  });

  it('exige sesión', async () => {
    const res = await t.gql(UPDATE_CONTACT, { input: { phone: '+525512345678' } });
    expect(errorCode(res)).toBe(ErrorCode.UNAUTHENTICATED);
  });
});

describe('privacidad del perfil', () => {
  it('el propio usuario ve sus datos privados en me y en user', async () => {
    const me = await t.gql<{ me: Profile }>(ME, {}, { token: ana.token });
    expect(me.data!.me.email).toContain('@example.test');
    expect(me.data!.me.privateContact?.phone).toBe(CONTACT.phone);

    const self = await t.gql<{ user: Profile }>(USER, { handle: ana.handle }, { token: ana.token });
    expect(self.data!.user.privateContact?.phone).toBe(CONTACT.phone);
    expect(self.data!.user.email).not.toBeNull();
  });

  it('otro usuario autenticado ve el perfil público sin privateContact, email ni consents', async () => {
    const res = await t.gql<{ user: Profile }>(USER, { handle: ana.handle }, { token: beto.token });
    expect(res.errors).toBeUndefined();
    const user = res.data!.user;
    expect(user).toMatchObject({
      handle: ana.handle,
      displayName: 'Ana López',
      tags: ['curious', 'calm'],
    });
    expect(user.privateContact).toBeNull();
    expect(user.email).toBeNull();
    expect(user.consents).toBeNull();
  });

  it('ningún valor privado aparece en la respuesta para otro usuario', async () => {
    const res = await t.gql<{ user: Profile }>(USER, { handle: ana.handle }, { token: beto.token });
    const raw = JSON.stringify(res.data);
    for (const value of Object.values(CONTACT)) {
      if (value !== CONTACT.institution) expect(raw).not.toContain(value);
    }
    expect(raw).not.toContain('IPN');
  });

  it('user devuelve null para un handle inexistente', async () => {
    const res = await t.gql<{ user: Profile | null }>(
      USER,
      { handle: 'no_existe_xyz' },
      { token: beto.token },
    );
    expect(res.data!.user).toBeNull();
  });
});

describe('casos límite del perfil', () => {
  it('updatePrivateContact sin campos no cambia nada', async () => {
    const before = await t.gql<{ me: Profile }>(ME, {}, { token: ana.token });
    const res = await t.gql<{ updatePrivateContact: Profile }>(
      UPDATE_CONTACT,
      { input: {} },
      { token: ana.token },
    );
    expect(res.data!.updatePrivateContact.privateContact).toEqual(before.data!.me.privateContact);
  });

  it('un usuario nuevo tiene perfil vacío: sin avatar, sin etiquetas y contacto en null', async () => {
    const nuevo = await registerUser(t, 'nuevo');
    const res = await t.gql<{ me: Profile }>(ME, {}, { token: nuevo.token });
    expect(res.data!.me).toMatchObject({ avatar: null, bio: null, tags: [] });
    expect(Object.values(res.data!.me.privateContact!).every((v) => v === null)).toBe(true);
  });

  it('updateMarketingConsent sigue funcionando', async () => {
    const res = await t.gql<{ updateMarketingConsent: { id: string } }>(
      `mutation { updateMarketingConsent(optIn: true) { id } }`,
      {},
      { token: ana.token },
    );
    expect(res.data!.updateMarketingConsent.id).toBe(ana.id);
  });
});

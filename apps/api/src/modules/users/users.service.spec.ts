import { ErrorCode } from '@sentio/core';
import { type Model, Types } from 'mongoose';
import { type User } from './schemas/user.schema';
import { UsersService } from './users.service';

/** Encadena `.lean().exec()` (y `.select()`) como hace Mongoose. */
function query<T>(value: T) {
  const q = {
    lean: () => q,
    select: () => q,
    exec: () => Promise.resolve(value),
  };
  return q;
}

function setup(overrides: Partial<Record<keyof Model<User>, jest.Mock>> = {}) {
  const model = {
    findById: jest.fn(() => query(null)),
    findByIdAndUpdate: jest.fn(() => query(null)),
    find: jest.fn(() => query([])),
    findOne: jest.fn(() => query(null)),
    updateOne: jest.fn(() => query(undefined)),
    create: jest.fn(),
    ...overrides,
  };
  return { service: new UsersService(model as unknown as Model<User>), model };
}

const missingId = new Types.ObjectId().toHexString();

async function expectNotFound(promise: Promise<unknown>) {
  await expect(promise).rejects.toMatchObject({ extensions: { code: ErrorCode.NOT_FOUND } });
}

describe('UsersService', () => {
  it('findById devuelve null con un id inválido sin consultar', async () => {
    const { service, model } = setup();
    await expect(service.findById('nope')).resolves.toBeNull();
    expect(model.findById).not.toHaveBeenCalled();
  });

  it('findByIds ignora ids inválidos y no consulta si no queda ninguno', async () => {
    const { service, model } = setup();
    await expect(service.findByIds(['x', 'y'])).resolves.toEqual([]);
    expect(model.find).not.toHaveBeenCalled();
  });

  it('updateProfile da NOT_FOUND si el usuario no existe', async () => {
    const { service } = setup();
    await expectNotFound(service.updateProfile(missingId, { bio: 'x' }));
  });

  it('updatePrivateContact usa $set y $unset según el valor', async () => {
    const doc = { _id: new Types.ObjectId() };
    const { service, model } = setup({ findByIdAndUpdate: jest.fn(() => query(doc)) });
    await service.updatePrivateContact(missingId, { phone: '+525512345678', studentId: null });
    expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
      missingId,
      {
        $set: { 'privateContact.phone': '+525512345678' },
        $unset: { 'privateContact.studentId': '' },
      },
      { new: true, runValidators: true },
    );
  });

  it('updatePrivateContact solo con borrados no manda $set', async () => {
    const { service, model } = setup({ findByIdAndUpdate: jest.fn(() => query({})) });
    await service.updatePrivateContact(missingId, { phone: null });
    const [, update] = model.findByIdAndUpdate.mock.calls[0] as unknown[];
    expect(update).toEqual({
      $unset: { 'privateContact.phone': '' },
    });
  });

  it('updatePrivateContact da NOT_FOUND si el usuario no existe', async () => {
    const { service } = setup();
    await expectNotFound(service.updatePrivateContact(missingId, { phone: '+525512345678' }));
    await expectNotFound(service.updatePrivateContact(missingId, {}));
  });

  it('setAvatar devuelve la foto anterior o null', async () => {
    const previous = { assetId: new Types.ObjectId(), url256: 'a', url512: 'b', blurhash: 'c' };
    const avatar = { ...previous, assetId: new Types.ObjectId() };
    const withPrev = setup({ findByIdAndUpdate: jest.fn(() => query({ avatar: previous })) });
    await expect(withPrev.service.setAvatar(missingId, avatar)).resolves.toBe(previous);
    const withoutPrev = setup({ findByIdAndUpdate: jest.fn(() => query({})) });
    await expect(withoutPrev.service.setAvatar(missingId, avatar)).resolves.toBeNull();
  });

  it('setAvatar y clearAvatar dan NOT_FOUND si el usuario no existe', async () => {
    const { service } = setup();
    await expectNotFound(
      service.setAvatar(missingId, {
        assetId: new Types.ObjectId(),
        url256: 'a',
        url512: 'b',
        blurhash: 'c',
      }),
    );
    await expectNotFound(service.clearAvatar(missingId));
  });

  it('clearAvatar sin foto previa devuelve previous null', async () => {
    const { service } = setup({ findByIdAndUpdate: jest.fn(() => query({ handle: 'ana' })) });
    await expect(service.clearAvatar(missingId)).resolves.toMatchObject({
      user: { handle: 'ana', avatar: null },
      previous: null,
    });
  });

  it('updateMarketingConsent da NOT_FOUND si el usuario no existe', async () => {
    const { service } = setup();
    await expectNotFound(service.updateMarketingConsent(missingId, true));
  });
});

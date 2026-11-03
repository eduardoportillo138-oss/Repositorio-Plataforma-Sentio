import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type Locale, type UpdateProfileInput } from '@sentio/core';
import { type ClientSession, Model, Types } from 'mongoose';
import { Errors } from '../../common/errors/app-error';
import { User, type UserDocumentLean } from './schemas/user.schema';

export interface CreateUserData {
  email: string;
  handle: string;
  displayName: string;
  passwordHash: string;
  locale: Locale;
  privacyNoticeVersion: string;
  marketingOptIn: boolean;
  ip: string | null;
  userAgent: string | null;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  async create(data: CreateUserData, session?: ClientSession): Promise<UserDocumentLean> {
    const now = new Date();
    const [doc] = await this.userModel.create(
      [
        {
          email: data.email,
          handle: data.handle,
          displayName: data.displayName,
          passwordHash: data.passwordHash,
          locale: data.locale,
          consents: {
            privacyNoticeVersion: data.privacyNoticeVersion,
            privacyNoticeAcceptedAt: now,
            marketingOptIn: data.marketingOptIn,
            marketingOptInUpdatedAt: now,
            ip: data.ip,
            userAgent: data.userAgent,
          },
        },
      ],
      { session },
    );
    if (!doc) throw new Error('No se pudo crear el usuario.');
    const { passwordHash: _omit, ...user } = doc.toObject();
    return user;
  }

  async findById(id: string): Promise<UserDocumentLean | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.userModel.findById(id).lean<UserDocumentLean>().exec();
  }

  async findByIds(ids: readonly string[]): Promise<UserDocumentLean[]> {
    const valid = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (valid.length === 0) return [];
    return this.userModel
      .find({ _id: { $in: valid } })
      .lean<UserDocumentLean[]>()
      .exec();
  }

  async findByHandle(handle: string): Promise<UserDocumentLean | null> {
    return this.userModel.findOne({ handle: handle.toLowerCase() }).lean<UserDocumentLean>().exec();
  }

  /** Único método que devuelve el hash de la contraseña. */
  async findByEmailWithPassword(
    email: string,
  ): Promise<(UserDocumentLean & { passwordHash: string }) | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+passwordHash')
      .lean<UserDocumentLean & { passwordHash: string }>()
      .exec();
  }

  async findTakenIdentifiers(
    email: string,
    handle: string,
  ): Promise<{ email: boolean; handle: boolean }> {
    const docs = await this.userModel
      .find({ $or: [{ email }, { handle }] }, { email: 1, handle: 1 })
      .lean<Pick<User, 'email' | 'handle'>[]>()
      .exec();
    return {
      email: docs.some((d) => d.email === email),
      handle: docs.some((d) => d.handle === handle),
    };
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await this.userModel.updateOne({ _id: userId }, { $set: { passwordHash } }).exec();
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserDocumentLean> {
    const doc = await this.userModel
      .findByIdAndUpdate(userId, { $set: input }, { new: true, runValidators: true })
      .lean<UserDocumentLean>()
      .exec();
    if (!doc) throw Errors.notFound('Usuario');
    return doc;
  }

  /** Revocación/otorgamiento del consentimiento para finalidades secundarias (LFPDPPP). */
  async updateMarketingConsent(userId: string, optIn: boolean): Promise<UserDocumentLean> {
    const doc = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $set: {
            'consents.marketingOptIn': optIn,
            'consents.marketingOptInUpdatedAt': new Date(),
          },
        },
        { new: true },
      )
      .lean<UserDocumentLean>()
      .exec();
    if (!doc) throw Errors.notFound('Usuario');
    return doc;
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  escapeRegex,
  type Locale,
  type PrivateContactData,
  type UpdateProfileInput,
} from '@sentio/core';
import { type ClientSession, Model, Types } from 'mongoose';
import { Errors } from '../../common/errors/app-error';
import { type Connection } from '../../common/pagination/connection.type';
import { paginate } from '../../common/pagination/paginate';
import { type PublicUserModel, toPublicUser } from './dto/public-user.model';
import { type Avatar, User, type UserDocumentLean } from './schemas/user.schema';
import { UserEvents } from './user-events';

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
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly events: UserEvents,
  ) {}

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
    if (input.displayName !== undefined) this.events.profileChanged(userId);
    return doc;
  }

  /** Campo omitido = no cambia; null = se borra. */
  async updatePrivateContact(userId: string, input: PrivateContactData): Promise<UserDocumentLean> {
    const $set: Record<string, string> = {};
    const $unset: Record<string, ''> = {};
    for (const [key, value] of Object.entries(input) as [string, string | null | undefined][]) {
      if (value === undefined) continue;
      if (value === null) $unset[`privateContact.${key}`] = '';
      else $set[`privateContact.${key}`] = value;
    }
    const update: Record<string, unknown> = {};
    if (Object.keys($set).length) update.$set = $set;
    if (Object.keys($unset).length) update.$unset = $unset;

    const doc =
      Object.keys(update).length === 0
        ? await this.findById(userId)
        : await this.userModel
            .findByIdAndUpdate(userId, update, { new: true, runValidators: true })
            .lean<UserDocumentLean>()
            .exec();
    if (!doc) throw Errors.notFound('Usuario');
    return doc;
  }

  /** Reemplaza la foto de perfil. Devuelve la anterior (para borrar sus objetos). */
  async setAvatar(userId: string, avatar: Avatar): Promise<Avatar | null> {
    const before = await this.userModel
      .findByIdAndUpdate(userId, { $set: { avatar } }, { new: false, projection: { avatar: 1 } })
      .lean<Pick<User, 'avatar'>>()
      .exec();
    if (!before) throw Errors.notFound('Usuario');
    this.events.profileChanged(userId);
    return before.avatar ?? null;
  }

  /** Quita la foto de perfil. Devuelve la anterior (para borrar sus objetos). */
  async clearAvatar(userId: string): Promise<{ user: UserDocumentLean; previous: Avatar | null }> {
    const before = await this.userModel
      .findByIdAndUpdate(userId, { $set: { avatar: null } }, { new: false })
      .lean<UserDocumentLean>()
      .exec();
    if (!before) throw Errors.notFound('Usuario');
    if (before.avatar) this.events.profileChanged(userId);
    return { user: { ...before, avatar: null }, previous: before.avatar ?? null };
  }

  /**
   * Búsqueda provisional de perfiles públicos por prefijo de @handle o de una palabra del
   * nombre. `query` llega normalizada (minúsculas, sin acentos). Solo datos públicos.
   * TODO(Fase 5): se reemplaza por SearchProvider con campos normalizados e índices.
   */
  searchPublic(
    query: string,
    args: { first?: number | null; after?: string | null },
  ): Promise<Connection<PublicUserModel>> {
    const prefix = escapeRegex(query);
    return paginate(this.userModel, toPublicUser, {
      filter: {
        status: 'active',
        $or: [
          { handle: { $regex: `^${prefix.replace(/^@/, '')}` } },
          // Inicio del nombre o de cualquier palabra del nombre.
          { displayName: { $regex: `(^|\\s)${prefix}`, $options: 'i' } },
        ],
      },
      sortField: 'handle',
      direction: 1,
      first: args.first,
      after: args.after,
    });
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

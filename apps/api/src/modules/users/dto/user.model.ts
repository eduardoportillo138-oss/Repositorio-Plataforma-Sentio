import { Field, ID, ObjectType } from '@nestjs/graphql';
import { type UserDocumentLean } from '../schemas/user.schema';

@ObjectType('Consents', { description: 'Consentimientos del titular (solo visibles para él).' })
export class ConsentsModel {
  @Field()
  privacyNoticeVersion!: string;

  @Field()
  privacyNoticeAcceptedAt!: Date;

  @Field()
  marketingOptIn!: boolean;

  @Field()
  marketingOptInUpdatedAt!: Date;
}

@ObjectType('User')
export class UserModel {
  @Field(() => ID)
  id!: string;

  @Field()
  handle!: string;

  @Field()
  displayName!: string;

  @Field(() => String, { nullable: true })
  avatarUrl!: string | null;

  @Field(() => String, { nullable: true })
  bio!: string | null;

  @Field()
  createdAt!: Date;

  /** Datos privados: los exponen field resolvers solo al propio usuario. */
  readonly private!: { email: string; consents: ConsentsModel; locale: string };
}

export function toUserModel(doc: UserDocumentLean): UserModel {
  return {
    id: doc._id.toHexString(),
    handle: doc.handle,
    displayName: doc.displayName,
    avatarUrl: doc.avatarUrl ?? null,
    bio: doc.bio ?? null,
    createdAt: doc.createdAt,
    private: {
      email: doc.email,
      locale: doc.locale,
      consents: {
        privacyNoticeVersion: doc.consents.privacyNoticeVersion,
        privacyNoticeAcceptedAt: doc.consents.privacyNoticeAcceptedAt,
        marketingOptIn: doc.consents.marketingOptIn,
        marketingOptInUpdatedAt: doc.consents.marketingOptInUpdatedAt,
      },
    },
  };
}

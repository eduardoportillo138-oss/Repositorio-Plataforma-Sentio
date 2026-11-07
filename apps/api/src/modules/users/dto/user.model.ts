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

@ObjectType('Avatar', { description: 'Foto de perfil procesada (WebP sin metadatos).' })
export class AvatarModel {
  @Field(() => ID)
  assetId!: string;

  @Field({ description: 'Variante cuadrada de 256 px.' })
  url256!: string;

  @Field({ description: 'Variante cuadrada de 512 px.' })
  url512!: string;

  @Field({ description: 'Marcador de carga (https://blurha.sh).' })
  blurhash!: string;
}

@ObjectType('PrivateContact', { description: 'Datos de contacto privados del estudiante.' })
export class PrivateContactModel {
  @Field(() => String, { nullable: true })
  phone!: string | null;

  @Field(() => String, { nullable: true })
  altEmail!: string | null;

  @Field(() => String, { nullable: true })
  institution!: string | null;

  @Field(() => String, { nullable: true })
  studentId!: string | null;

  @Field(() => String, { nullable: true })
  emergencyContactName!: string | null;

  @Field(() => String, { nullable: true })
  emergencyContactPhone!: string | null;
}

@ObjectType('ProfileQuality', {
  description: 'Cualidad del catálogo. El texto visible se traduce en el cliente con su clave.',
})
export class ProfileQualityModel {
  @Field()
  key!: string;
}

@ObjectType('User')
export class UserModel {
  @Field(() => ID)
  id!: string;

  @Field()
  handle!: string;

  @Field()
  displayName!: string;

  @Field(() => AvatarModel, { nullable: true })
  avatar!: AvatarModel | null;

  @Field(() => String, { nullable: true })
  bio!: string | null;

  @Field(() => [String], { description: 'Claves de cualidades (máximo 3).' })
  tags!: string[];

  @Field()
  createdAt!: Date;

  /**
   * Datos privados: los exponen field resolvers SOLO al propio usuario.
   * No es un @Field: GraphQL nunca lo serializa directamente.
   */
  readonly private!: {
    email: string;
    consents: ConsentsModel;
    locale: string;
    privateContact: PrivateContactModel;
  };
}

export function toUserModel(doc: UserDocumentLean): UserModel {
  const pc = doc.privateContact ?? {};
  return {
    id: doc._id.toHexString(),
    handle: doc.handle,
    displayName: doc.displayName,
    avatar: doc.avatar
      ? {
          assetId: doc.avatar.assetId.toHexString(),
          url256: doc.avatar.url256,
          url512: doc.avatar.url512,
          blurhash: doc.avatar.blurhash,
        }
      : null,
    bio: doc.bio ?? null,
    tags: doc.tags ?? [],
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
      privateContact: {
        phone: pc.phone ?? null,
        altEmail: pc.altEmail ?? null,
        institution: pc.institution ?? null,
        studentId: pc.studentId ?? null,
        emergencyContactName: pc.emergencyContactName ?? null,
        emergencyContactPhone: pc.emergencyContactPhone ?? null,
      },
    },
  };
}

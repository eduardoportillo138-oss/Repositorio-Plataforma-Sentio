import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../../common/pagination/connection.type';
import { type UserDocumentLean } from '../schemas/user.schema';
import { AvatarModel } from './user.model';

/**
 * Perfil público de una persona, para autores de posts, resultados de búsqueda, etc.
 * Es un tipo distinto de `User` a propósito: no tiene campos privados (email, consents,
 * privateContact), así que ninguna consulta puede pedirlos por este camino.
 */
@ObjectType('PublicUser')
export class PublicUserModel {
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

  @Field(() => [String])
  tags!: string[];
}

@ObjectType()
export class PublicUserConnection extends Paginated(PublicUserModel, 'PublicUser') {}

export function toPublicUser(doc: UserDocumentLean): PublicUserModel {
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
  };
}

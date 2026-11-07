import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { AvatarModel } from '../../users/dto/user.model';
import { MEDIA_STATUSES, type MediaAsset, type MediaStatus } from '../schemas/media-asset.schema';

export const MediaStatusEnum = Object.fromEntries(MEDIA_STATUSES.map((s) => [s, s])) as {
  [K in MediaStatus]: K;
};
registerEnumType(MediaStatusEnum, { name: 'MediaStatus' });

@ObjectType('MediaAsset')
export class MediaAssetModel {
  @Field(() => ID)
  id!: string;

  @Field()
  kind!: string;

  @Field()
  purpose!: string;

  @Field(() => MediaStatusEnum)
  status!: MediaStatus;

  @Field(() => AvatarModel, {
    nullable: true,
    description: 'Variantes procesadas, cuando status = ready y purpose = avatar.',
  })
  avatar!: AvatarModel | null;
}

@ObjectType('UploadHeader')
export class UploadHeaderModel {
  @Field()
  name!: string;

  @Field()
  value!: string;
}

@ObjectType('AvatarUploadTicket', {
  description: 'Datos para subir el archivo con un PUT directo al almacenamiento.',
})
export class AvatarUploadTicketModel {
  @Field(() => ID)
  assetId!: string;

  @Field({ description: 'URL prefirmada (PUT). Vence en 10 minutos.' })
  uploadUrl!: string;

  @Field(() => [UploadHeaderModel], { description: 'Encabezados obligatorios del PUT.' })
  headers!: UploadHeaderModel[];

  @Field()
  expiresAt!: Date;
}

export function toMediaAssetModel(asset: MediaAsset): MediaAssetModel {
  const v256 = asset.variants.find((v) => v.size === 256);
  const v512 = asset.variants.find((v) => v.size === 512);
  return {
    id: asset._id.toHexString(),
    kind: asset.kind,
    purpose: asset.purpose,
    status: asset.status,
    avatar:
      asset.status === 'ready' && v256 && v512 && asset.blurhash
        ? {
            assetId: asset._id.toHexString(),
            url256: v256.url,
            url512: v512.url,
            blurhash: asset.blurhash,
          }
        : null,
  };
}

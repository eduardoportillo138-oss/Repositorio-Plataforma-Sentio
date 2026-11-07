import { Args, ID, Int, Mutation, Resolver } from '@nestjs/graphql';
import { objectIdSchema } from '@sentio/core';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { type AuthUser } from '../../common/graphql/context';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { toUserModel, UserModel } from '../users/dto/user.model';
import { AvatarUploadTicketModel, MediaAssetModel, toMediaAssetModel } from './dto/media-asset.dto';
import { MediaService } from './media.service';

@Resolver()
export class MediaResolver {
  constructor(private readonly media: MediaService) {}

  @Mutation(() => AvatarUploadTicketModel, {
    description:
      'Paso 1 de la foto de perfil: JPEG, PNG, WebP o HEIC de hasta 5 MB. ' +
      'Devuelve una URL prefirmada (PUT) válida 10 minutos.',
  })
  requestAvatarUpload(
    @CurrentUser() viewer: AuthUser,
    @Args('mimeType') mimeType: string,
    @Args('sizeBytes', { type: () => Int }) sizeBytes: number,
  ): Promise<AvatarUploadTicketModel> {
    return this.media.requestAvatarUpload(viewer.userId, {
      mimeType: mimeType as never,
      sizeBytes,
    });
  }

  @Mutation(() => MediaAssetModel, {
    description:
      'Paso 2: confirma la subida y la manda a procesar. Si las colas están activas el ' +
      'resultado llega por Socket.IO (media:ready); si no, se devuelve ya procesado.',
  })
  async confirmAvatarUpload(
    @CurrentUser() viewer: AuthUser,
    @Args('assetId', { type: () => ID }, new ZodValidationPipe(objectIdSchema)) assetId: string,
  ): Promise<MediaAssetModel> {
    return toMediaAssetModel(await this.media.confirmAvatarUpload(viewer.userId, assetId));
  }

  @Mutation(() => UserModel, { description: 'Quita la foto de perfil.' })
  async removeAvatar(@CurrentUser() viewer: AuthUser): Promise<UserModel> {
    return toUserModel(await this.media.removeAvatar(viewer.userId));
  }
}

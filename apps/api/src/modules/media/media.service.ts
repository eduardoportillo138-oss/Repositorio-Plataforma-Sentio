import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MediaAsset } from './schemas/media-asset.schema';

@Injectable()
export class MediaService {
  constructor(@InjectModel(MediaAsset.name) private readonly model: Model<MediaAsset>) {}

  async findById(id: string): Promise<MediaAsset | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.model.findById(id).lean<MediaAsset>().exec();
  }

  // TODO(Etapa 1): URLs prefirmadas S3, confirmación de subida y procesamiento (miniaturas) en el worker media.
}

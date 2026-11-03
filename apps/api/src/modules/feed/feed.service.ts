import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FeedItem } from './schemas/feed-item.schema';

@Injectable()
export class FeedService {
  constructor(@InjectModel(FeedItem.name) private readonly model: Model<FeedItem>) {}

  async findById(id: string): Promise<FeedItem | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.model.findById(id).lean<FeedItem>().exec();
  }

  // TODO(Etapa 1): feed "Siguiendo" con fan-out on write (worker feed-fanout) y paginación Relay.
}

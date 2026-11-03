import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reaction } from './schemas/reaction.schema';

@Injectable()
export class ReactionsService {
  constructor(@InjectModel(Reaction.name) private readonly model: Model<Reaction>) {}

  async findById(id: string): Promise<Reaction | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.model.findById(id).lean<Reaction>().exec();
  }

  // TODO(Etapa 1): reaccionar / quitar reacción de forma idempotente y actualizar contadores.
}

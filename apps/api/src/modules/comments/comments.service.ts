import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment } from './schemas/comment.schema';

@Injectable()
export class CommentsService {
  constructor(@InjectModel(Comment.name) private readonly model: Model<Comment>) {}

  async findById(id: string): Promise<Comment | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.model.findById(id).lean<Comment>().exec();
  }

  // TODO(Etapa 1): comentarios con un nivel de respuestas, paginación y contadores en posts.
}

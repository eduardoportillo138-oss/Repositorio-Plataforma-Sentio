import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post } from './schemas/post.schema';

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private readonly model: Model<Post>) {}

  async findById(id: string): Promise<Post | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.model.findById(id).lean<Post>().exec();
  }

  // TODO(Etapa 1): crear/editar/borrar posts, adjuntar media, visibilidad y contadores.
}

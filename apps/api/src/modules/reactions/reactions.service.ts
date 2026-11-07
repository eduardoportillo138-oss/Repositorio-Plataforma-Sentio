import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { type Connection, Model, mongo, Types } from 'mongoose';
import { Errors } from '../../common/errors/app-error';
import { PostsService } from '../posts/posts.service';
import { type Post } from '../posts/schemas/post.schema';
import { Reaction } from './schemas/reaction.schema';

/** Reintentos ante un choque concurrente (dos toggles simultáneos del mismo usuario). */
const MAX_TOGGLE_ATTEMPTS = 3;

@Injectable()
export class ReactionsService {
  constructor(
    @InjectModel(Reaction.name) private readonly model: Model<Reaction>,
    @InjectConnection() private readonly connection: Connection,
    private readonly posts: PostsService,
  ) {}

  async findById(id: string): Promise<Reaction | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.model.findById(id).lean<Reaction>().exec();
  }

  /**
   * Da o quita "Me gusta". La reacción y el contador `counts.reactions` cambian en la misma
   * transacción; el índice único (targetType, targetId, userId) impide duplicados aunque
   * lleguen dos peticiones a la vez. Devuelve el post actualizado.
   */
  async toggleLike(userId: string, postId: string): Promise<{ post: Post; liked: boolean }> {
    const visible = await this.posts.findVisible(postId, userId);
    if (!visible) throw Errors.notFound('Publicación');

    const filter = {
      targetType: 'post' as const,
      targetId: visible._id,
      userId: new Types.ObjectId(userId),
    };

    for (let attempt = 1; ; attempt++) {
      try {
        const liked = await this.connection.transaction(async (session) => {
          const removed = await this.model.deleteOne(filter, { session }).exec();
          if (removed.deletedCount > 0) {
            await this.posts.incrementCounts(visible._id, { reactions: -1 }, session);
            return false;
          }
          await this.model.create([{ ...filter, type: 'like' }], { session });
          await this.posts.incrementCounts(visible._id, { reactions: 1 }, session);
          return true;
        });
        const post = await this.posts.findById(postId);
        return { post: post ?? visible, liked };
      } catch (error) {
        // Otra petición insertó el like entre nuestra lectura y la escritura: se repite el toggle.
        const duplicate = error instanceof mongo.MongoServerError && error.code === 11000;
        if (!duplicate || attempt >= MAX_TOGGLE_ATTEMPTS) throw error;
      }
    }
  }

  /** De estos posts, cuáles tienen "Me gusta" del usuario (una sola consulta). */
  async likedPostIds(userId: string, postIds: readonly string[]): Promise<Set<string>> {
    const ids = postIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (ids.length === 0 || !Types.ObjectId.isValid(userId)) return new Set();
    const docs = await this.model
      .find(
        { targetType: 'post', userId: new Types.ObjectId(userId), targetId: { $in: ids } },
        { targetId: 1 },
      )
      .lean<Pick<Reaction, 'targetId'>[]>()
      .exec();
    return new Set(docs.map((d) => d.targetId.toHexString()));
  }
}

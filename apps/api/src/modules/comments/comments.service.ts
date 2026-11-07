import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { type AddCommentInput, addCommentSchema } from '@sentio/core';
import { type Connection, Model, Types } from 'mongoose';
import { Errors } from '../../common/errors/app-error';
import { type Connection as Page } from '../../common/pagination/connection.type';
import { paginate } from '../../common/pagination/paginate';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PostsService } from '../posts/posts.service';
import { type Post } from '../posts/schemas/post.schema';
import { UsersService } from '../users/users.service';
import { type CommentModel, toCommentModel } from './dto/comment.dto';
import { Comment } from './schemas/comment.schema';

const addPipe = new ZodValidationPipe(addCommentSchema);

const EMPTY_PAGE: Page<never> = {
  edges: [],
  pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null },
};

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private readonly model: Model<Comment>,
    @InjectConnection() private readonly connection: Connection,
    private readonly posts: PostsService,
    private readonly users: UsersService,
  ) {}

  async findById(id: string): Promise<Comment | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.model.findById(id).lean<Comment>().exec();
  }

  /** Comenta un post visible. El comentario y `counts.comments` cambian en la misma transacción. */
  async add(userId: string, raw: AddCommentInput): Promise<Comment> {
    const input = addPipe.transform(raw);
    const post = await this.posts.findVisible(input.postId, userId);
    if (!post) throw Errors.notFound('Publicación');
    const author = await this.users.findById(userId);
    if (!author) throw Errors.notFound('Usuario');

    return this.connection.transaction(async (session) => {
      const [doc] = await this.model.create(
        [
          {
            postId: post._id,
            authorId: author._id,
            author: { handle: author.handle, displayName: author.displayName },
            text: input.text,
          },
        ],
        { session },
      );
      await this.posts.incrementCounts(post._id, { comments: 1 }, session);
      return doc!.toObject();
    });
  }

  /** Lo borran el autor del comentario o el autor del post. Devuelve el post actualizado. */
  async remove(userId: string, commentId: string): Promise<Post | null> {
    const comment = await this.findById(commentId);
    if (!comment || comment.status !== 'active') throw Errors.notFound('Comentario');
    const post = await this.posts.findById(comment.postId.toHexString());
    const allowed = comment.authorId.equals(userId) || Boolean(post?.authorId.equals(userId));
    if (!allowed) {
      throw Errors.forbidden('Solo el autor del comentario o de la publicación puede borrarlo.');
    }

    await this.connection.transaction(async (session) => {
      const res = await this.model
        .updateOne(
          { _id: comment._id, status: 'active' },
          { $set: { status: 'removed', removedAt: new Date() } },
          { session },
        )
        .exec();
      if (res.modifiedCount > 0 && post) {
        await this.posts.incrementCounts(post._id, { comments: -1 }, session);
      }
    });
    return post ? this.posts.findById(post._id.toHexString()) : null;
  }

  /** Comentarios de primer nivel de un post visible, del más antiguo al más reciente. */
  async list(
    postId: string,
    viewerId: string,
    args: { first?: number | null; after?: string | null },
  ): Promise<Page<CommentModel>> {
    const post = await this.posts.findVisible(postId, viewerId);
    if (!post) return EMPTY_PAGE;
    return paginate(this.model, toCommentModel, {
      filter: { postId: post._id, parentId: null, status: 'active' },
      sortField: 'createdAt',
      direction: 1,
      first: args.first,
      after: args.after,
    });
  }
}

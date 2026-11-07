import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type CreatePostData } from '@sentio/core';
import { type FilterQuery, Model, Types } from 'mongoose';
import { Errors } from '../../common/errors/app-error';
import { type Connection } from '../../common/pagination/connection.type';
import { paginate } from '../../common/pagination/paginate';
import { type UserDocumentLean } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { type PostModel, toPostModel } from './dto/post.dto';
import { Post, type PostAuthor } from './schemas/post.schema';

export interface PageArgs {
  first?: number | null;
  after?: string | null;
}

const EMPTY_PAGE: Connection<never> = {
  edges: [],
  pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null },
};

export function authorSnapshot(user: UserDocumentLean): PostAuthor {
  return {
    handle: user.handle,
    displayName: user.displayName,
    avatarUrl256: user.avatar?.url256 ?? null,
  };
}

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private readonly model: Model<Post>,
    private readonly users: UsersService,
  ) {}

  async findById(id: string): Promise<Post | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.model.findById(id).lean<Post>().exec();
  }

  async create(authorId: string, input: CreatePostData): Promise<PostModel> {
    const author = await this.users.findById(authorId);
    if (!author) throw Errors.notFound('Usuario');
    const doc = await this.model.create({
      authorId: author._id,
      author: authorSnapshot(author),
      title: input.title,
      text: input.text,
      visibility: input.visibility,
    });
    return toPostModel(doc.toObject());
  }

  /** Borrado lógico: solo el autor. */
  async remove(userId: string, postId: string): Promise<string> {
    const post = await this.findById(postId);
    if (!post || post.status !== 'active') throw Errors.notFound('Publicación');
    if (!post.authorId.equals(userId))
      throw Errors.forbidden('Solo el autor puede borrar su publicación.');
    await this.model
      .updateOne(
        { _id: post._id, status: 'active' },
        { $set: { status: 'removed', removedAt: new Date() } },
      )
      .exec();
    return postId;
  }

  /**
   * Inicio: publicaciones públicas y activas, de la más reciente a la más antigua.
   * Más adelante se reemplaza por el feed "Siguiendo" con fan-out.
   */
  homeFeed(args: PageArgs): Promise<Connection<PostModel>> {
    return paginate(this.model, toPostModel, {
      filter: { status: 'active', visibility: 'public' },
      sortField: 'createdAt',
      direction: -1,
      first: args.first,
      after: args.after,
    });
  }

  /** Publicaciones de un perfil. El autor ve todas las suyas; los demás, solo las públicas. */
  async userPosts(
    handle: string,
    viewerId: string | null,
    args: PageArgs,
  ): Promise<Connection<PostModel>> {
    const user = await this.users.findByHandle(handle);
    if (!user || user.status !== 'active') return EMPTY_PAGE;
    const isSelf = viewerId !== null && user._id.equals(viewerId);
    const filter: FilterQuery<Post> = {
      authorId: user._id,
      status: 'active',
      ...(isSelf ? {} : { visibility: 'public' }),
    };
    return paginate(this.model, toPostModel, {
      filter,
      sortField: 'createdAt',
      direction: -1,
      first: args.first,
      after: args.after,
    });
  }

  /** Actualiza la copia del autor en todas sus publicaciones. */
  async syncAuthor(userId: string): Promise<number> {
    const user = await this.users.findById(userId);
    if (!user) return 0;
    const res = await this.model
      .updateMany({ authorId: user._id }, { $set: { author: authorSnapshot(user) } })
      .exec();
    return res.modifiedCount;
  }
}

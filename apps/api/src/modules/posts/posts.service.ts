import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type CreatePostData } from '@sentio/core';
import { type ClientSession, type FilterQuery, Model, Types } from 'mongoose';
import { Errors } from '../../common/errors/app-error';
import { type Connection } from '../../common/pagination/connection.type';
import { paginate } from '../../common/pagination/paginate';
import { postSearchFields } from '../search/search-fields';
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

export function isVisibleTo(post: Post, viewerId: string | null): boolean {
  if (post.status !== 'active') return false;
  if (viewerId !== null && post.authorId.equals(viewerId)) return true;
  return post.visibility === 'public' && post.groupId === null;
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

  async findByIds(ids: readonly string[]): Promise<Post[]> {
    const valid = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (valid.length === 0) return [];
    return this.model
      .find({ _id: { $in: valid } })
      .lean<Post[]>()
      .exec();
  }

  /**
   * Única regla de visibilidad de un post para interacciones y detalle: activo y público,
   * o del propio usuario. Los posts de grupo no se exponen por aquí.
   * Devuelve null tanto si no existe como si no se puede ver (no revela su existencia).
   */
  async findVisible(postId: string, viewerId: string): Promise<Post | null> {
    const post = await this.findById(postId);
    return post && isVisibleTo(post, viewerId) ? post : null;
  }

  /** Suma (o resta) contadores. Pensado para usarse dentro de una transacción. */
  async incrementCounts(
    postId: Types.ObjectId | string,
    delta: Partial<Record<'reactions' | 'comments' | 'shares', number>>,
    session?: ClientSession,
  ): Promise<void> {
    const $inc = Object.fromEntries(
      Object.entries(delta)
        .filter(([, v]) => v)
        .map(([k, v]) => [`counts.${k}`, v]),
    );
    if (Object.keys($inc).length === 0) return;
    await this.model.updateOne({ _id: postId }, { $inc }, { session }).exec();
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
      ...postSearchFields(input.title, input.text),
    });
    const { searchTitle: _t, searchText: _x, ...post } = doc.toObject();
    return toPostModel(post);
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

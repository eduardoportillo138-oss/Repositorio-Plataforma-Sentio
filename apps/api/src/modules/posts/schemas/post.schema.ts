import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { POST_TEXT_MAX_LENGTH, POST_TITLE_MAX_LENGTH } from '@sentio/core';
import { type HydratedDocument, Types } from 'mongoose';

/** `group` queda reservado para posts de grupo (otra fase). */
export const POST_VISIBILITIES = ['public', 'followers', 'group'] as const;
export type PostVisibility = (typeof POST_VISIBILITIES)[number];

export const POST_STATUSES = ['active', 'removed'] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

/**
 * Copia de los datos públicos del autor al momento de publicar. Evita un lookup por post en
 * listados masivos y sirve de respaldo si el autor ya no existe. La mantiene al día
 * AuthorSyncService cuando el autor cambia su nombre o su foto.
 */
@Schema({ _id: false })
export class PostAuthor {
  @Prop({ required: true })
  handle!: string;

  @Prop({ required: true })
  displayName!: string;

  @Prop({ type: String, default: null })
  avatarUrl256!: string | null;
}
const PostAuthorSchema = SchemaFactory.createForClass(PostAuthor);

@Schema({ _id: false })
export class PostCounts {
  @Prop({ default: 0, min: 0 })
  reactions!: number;

  @Prop({ default: 0, min: 0 })
  comments!: number;

  @Prop({ default: 0, min: 0 })
  shares!: number;
}
const PostCountsSchema = SchemaFactory.createForClass(PostCounts);

@Schema({ collection: 'posts', timestamps: true })
export class Post {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  authorId!: Types.ObjectId;

  @Prop({ type: PostAuthorSchema, required: true })
  author!: PostAuthor;

  /** null = post de perfil; con valor = post dentro de un grupo. */
  @Prop({ type: Types.ObjectId, default: null })
  groupId!: Types.ObjectId | null;

  @Prop({ required: true, trim: true, minlength: 1, maxlength: POST_TITLE_MAX_LENGTH })
  title!: string;

  @Prop({ type: String, default: '', maxlength: POST_TEXT_MAX_LENGTH })
  text!: string;

  @Prop({ type: [Types.ObjectId], default: [] })
  mediaIds!: Types.ObjectId[];

  @Prop({ type: String, enum: POST_VISIBILITIES, default: 'public' })
  visibility!: PostVisibility;

  @Prop({ type: PostCountsSchema, default: () => ({}) })
  counts!: PostCounts;

  @Prop({ type: String, enum: POST_STATUSES, default: 'active' })
  status!: PostStatus;

  @Prop({ type: Date, default: null })
  removedAt!: Date | null;

  /** Título y descripción normalizados para la búsqueda local. No se seleccionan por defecto. */
  @Prop({ type: String, default: '', select: false })
  searchTitle?: string;

  @Prop({ type: String, default: '', select: false })
  searchText?: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export type PostDocument = HydratedDocument<Post>;

export const PostSchema = SchemaFactory.createForClass(Post);
// homeFeed: públicos y activos, del más reciente al más antiguo (paginación keyset).
PostSchema.index(
  { status: 1, visibility: 1, createdAt: -1, _id: -1 },
  { name: 'feed_status_visibility_createdAt' },
);
// userPosts y la sincronización de la copia del autor.
PostSchema.index({ authorId: 1, createdAt: -1, _id: -1 }, { name: 'author_createdAt' });
PostSchema.index({ groupId: 1, createdAt: -1, _id: -1 }, { name: 'group_createdAt' });
// Búsqueda local: palabras completas por índice de texto (sin stemming: idioma "none").
PostSchema.index(
  { searchTitle: 'text', searchText: 'text' },
  { name: 'search_text', weights: { searchTitle: 3, searchText: 1 }, default_language: 'none' },
);

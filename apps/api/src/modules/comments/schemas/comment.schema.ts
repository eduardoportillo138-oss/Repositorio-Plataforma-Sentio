import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { COMMENT_MAX_LENGTH } from '@sentio/core';
import { type HydratedDocument, Types } from 'mongoose';

export const COMMENT_STATUSES = ['active', 'removed'] as const;
export type CommentStatus = (typeof COMMENT_STATUSES)[number];

/** Copia del autor al comentar: respaldo si la cuenta ya no está activa. */
@Schema({ _id: false })
export class CommentAuthor {
  @Prop({ required: true })
  handle!: string;

  @Prop({ required: true })
  displayName!: string;
}
const CommentAuthorSchema = SchemaFactory.createForClass(CommentAuthor);

@Schema({ collection: 'comments', timestamps: true })
export class Comment {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  postId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  authorId!: Types.ObjectId;

  @Prop({ type: CommentAuthorSchema, required: true })
  author!: CommentAuthor;

  /** Comentario padre para respuestas (por ahora siempre null: solo primer nivel). */
  @Prop({ type: Types.ObjectId, default: null })
  parentId!: Types.ObjectId | null;

  @Prop({ required: true, trim: true, minlength: 1, maxlength: COMMENT_MAX_LENGTH })
  text!: string;

  @Prop({ type: String, enum: COMMENT_STATUSES, default: 'active' })
  status!: CommentStatus;

  @Prop({ type: Date, default: null })
  removedAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export type CommentDocument = HydratedDocument<Comment>;

export const CommentSchema = SchemaFactory.createForClass(Comment);
// postComments: primer nivel, activos, del más antiguo al más reciente (paginación keyset).
CommentSchema.index(
  { postId: 1, parentId: 1, status: 1, createdAt: 1, _id: 1 },
  { name: 'post_thread_createdAt' },
);

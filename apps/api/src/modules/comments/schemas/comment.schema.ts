import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

@Schema({ collection: 'comments', timestamps: true })
export class Comment {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  postId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  authorId!: Types.ObjectId;

  /** Comentario padre para respuestas. */
  @Prop({ type: Types.ObjectId, default: null })
  parentId!: Types.ObjectId | null;

  @Prop({ required: true, maxlength: 2000 })
  text!: string;

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export type CommentDocument = HydratedDocument<Comment>;

export const CommentSchema = SchemaFactory.createForClass(Comment);
CommentSchema.index({ postId: 1, parentId: 1, createdAt: 1, _id: 1 });

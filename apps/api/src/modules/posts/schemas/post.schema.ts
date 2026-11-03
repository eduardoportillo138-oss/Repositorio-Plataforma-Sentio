import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

export const POST_VISIBILITIES = ['public', 'followers', 'group'] as const;
export type PostVisibility = (typeof POST_VISIBILITIES)[number];
@Schema({ collection: 'posts', timestamps: true })
export class Post {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  authorId!: Types.ObjectId;

  /** null = post de perfil; con valor = post dentro de un grupo. */
  @Prop({ type: Types.ObjectId, default: null })
  groupId!: Types.ObjectId | null;

  @Prop({ type: String, default: '', maxlength: 5000 })
  text!: string;

  @Prop({ type: [Types.ObjectId], default: [] })
  mediaIds!: Types.ObjectId[];

  @Prop({ type: String, enum: POST_VISIBILITIES, default: 'public' })
  visibility!: PostVisibility;

  @Prop({ default: 0, min: 0 })
  reactionCount!: number;

  @Prop({ default: 0, min: 0 })
  commentCount!: number;

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export type PostDocument = HydratedDocument<Post>;

export const PostSchema = SchemaFactory.createForClass(Post);
PostSchema.index({ authorId: 1, createdAt: -1, _id: -1 });
PostSchema.index({ groupId: 1, createdAt: -1, _id: -1 });

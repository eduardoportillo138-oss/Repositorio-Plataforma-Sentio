import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

@Schema({ collection: 'feed_items', timestamps: true })
export class FeedItem {
  _id!: Types.ObjectId;

  /** Dueño de la bandeja (quien ve el post). */
  @Prop({ type: Types.ObjectId, required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  postId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  authorId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, default: null })
  groupId!: Types.ObjectId | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export type FeedItemDocument = HydratedDocument<FeedItem>;

export const FeedItemSchema = SchemaFactory.createForClass(FeedItem);
FeedItemSchema.index({ userId: 1, createdAt: -1, _id: -1 });
FeedItemSchema.index({ userId: 1, postId: 1 }, { unique: true });

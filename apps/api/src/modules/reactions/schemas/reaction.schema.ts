import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

export const REACTION_TARGETS = ['post', 'comment'] as const;
export const REACTION_TYPES = ['like', 'love', 'haha', 'wow', 'sad', 'angry'] as const;
export type ReactionTarget = (typeof REACTION_TARGETS)[number];
export type ReactionType = (typeof REACTION_TYPES)[number];
@Schema({ collection: 'reactions', timestamps: true })
export class Reaction {
  _id!: Types.ObjectId;

  @Prop({ type: String, enum: REACTION_TARGETS, required: true })
  targetType!: ReactionTarget;

  @Prop({ type: Types.ObjectId, required: true })
  targetId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, enum: REACTION_TYPES, default: 'like' })
  type!: ReactionType;

  createdAt!: Date;
  updatedAt!: Date;
}

export type ReactionDocument = HydratedDocument<Reaction>;

export const ReactionSchema = SchemaFactory.createForClass(Reaction);
ReactionSchema.index({ targetType: 1, targetId: 1, userId: 1 }, { unique: true });
ReactionSchema.index({ userId: 1, createdAt: -1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

@Schema({ collection: 'conversations', timestamps: true })
export class Conversation {
  _id!: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], required: true })
  participantIds!: Types.ObjectId[];

  /** Conversación ligada a un grupo (chat de grupo); null en chats directos. */
  @Prop({ type: Types.ObjectId, default: null })
  groupId!: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  lastMessageAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export type ConversationDocument = HydratedDocument<Conversation>;

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({ participantIds: 1, lastMessageAt: -1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

@Schema({ collection: 'messages', timestamps: true })
export class Message {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  conversationId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  senderId!: Types.ObjectId;

  @Prop({ required: true, maxlength: 4000 })
  text!: string;

  @Prop({ type: Date, default: null })
  editedAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export type MessageDocument = HydratedDocument<Message>;

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ conversationId: 1, createdAt: -1, _id: -1 });

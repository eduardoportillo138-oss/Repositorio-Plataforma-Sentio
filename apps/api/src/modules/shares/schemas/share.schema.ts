import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SHARE_MESSAGE_MAX_LENGTH } from '@sentio/core';
import { type HydratedDocument, Types } from 'mongoose';

/** Un post compartido con una persona concreta (un documento por destinatario). */
@Schema({ collection: 'shares', timestamps: { createdAt: true, updatedAt: false } })
export class Share {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  postId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  senderId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  recipientId!: Types.ObjectId;

  @Prop({ type: String, default: null, maxlength: SHARE_MESSAGE_MAX_LENGTH })
  message!: string | null;

  createdAt!: Date;
}

export type ShareDocument = HydratedDocument<Share>;

export const ShareSchema = SchemaFactory.createForClass(Share);
ShareSchema.index({ recipientId: 1, createdAt: -1, _id: -1 }, { name: 'recipient_createdAt' });
ShareSchema.index({ postId: 1, createdAt: -1 }, { name: 'post_createdAt' });
ShareSchema.index({ senderId: 1, createdAt: -1 }, { name: 'sender_createdAt' });

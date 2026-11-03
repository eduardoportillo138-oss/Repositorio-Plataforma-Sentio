import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

export const NOTIFICATION_TYPES = [
  'follow',
  'reaction',
  'comment',
  'mention',
  'group_invite',
  'group_request',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
@Schema({ collection: 'notifications', timestamps: true })
export class Notification {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, enum: NOTIFICATION_TYPES, required: true })
  type!: NotificationType;

  @Prop({ type: Types.ObjectId, default: null })
  actorId!: Types.ObjectId | null;

  /** Referencia genérica a la entidad (post, comentario, grupo…). */
  @Prop(
    raw({
      type: { kind: { type: String }, id: { type: Types.ObjectId } },
      _id: false,
      default: null,
    }),
  )
  entity!: { kind: string; id: Types.ObjectId } | null;

  @Prop({ type: Date, default: null })
  readAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export type NotificationDocument = HydratedDocument<Notification>;

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1, createdAt: -1, _id: -1 });
NotificationSchema.index({ userId: 1, readAt: 1 });

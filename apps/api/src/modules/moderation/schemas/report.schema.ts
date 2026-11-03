import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

export const REPORT_TARGETS = ['post', 'comment', 'user', 'group', 'message'] as const;
export const REPORT_STATUSES = ['open', 'resolved', 'dismissed'] as const;
export type ReportTarget = (typeof REPORT_TARGETS)[number];
export type ReportStatus = (typeof REPORT_STATUSES)[number];
@Schema({ collection: 'reports', timestamps: true })
export class Report {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  reporterId!: Types.ObjectId;

  @Prop({ type: String, enum: REPORT_TARGETS, required: true })
  targetType!: ReportTarget;

  @Prop({ type: Types.ObjectId, required: true })
  targetId!: Types.ObjectId;

  /** Si el contenido pertenece a un grupo, lo modera ese grupo. */
  @Prop({ type: Types.ObjectId, default: null })
  groupId!: Types.ObjectId | null;

  @Prop({ required: true, maxlength: 500 })
  reason!: string;

  @Prop({ type: String, enum: REPORT_STATUSES, default: 'open' })
  status!: ReportStatus;

  @Prop({ type: Types.ObjectId, default: null })
  resolvedBy!: Types.ObjectId | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export type ReportDocument = HydratedDocument<Report>;

export const ReportSchema = SchemaFactory.createForClass(Report);
ReportSchema.index({ status: 1, groupId: 1, createdAt: -1 });
ReportSchema.index({ targetType: 1, targetId: 1 });

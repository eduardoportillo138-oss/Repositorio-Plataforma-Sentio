import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { GroupVisibility } from '@sentio/core';
import { type HydratedDocument, Types } from 'mongoose';

@Schema({ collection: 'groups', timestamps: true })
export class Group {
  _id!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 80 })
  name!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  slug!: string;

  @Prop({ type: String, default: null, maxlength: 1000 })
  description!: string | null;

  @Prop({ type: String, enum: Object.values(GroupVisibility), default: GroupVisibility.PRIVATE })
  visibility!: GroupVisibility;

  @Prop({ type: Types.ObjectId, required: true })
  ownerId!: Types.ObjectId;

  /** Contador desnormalizado de miembros activos. */
  @Prop({ default: 0, min: 0 })
  memberCount!: number;

  createdAt!: Date;
  updatedAt!: Date;
}

export type GroupDocument = HydratedDocument<Group>;

export const GroupSchema = SchemaFactory.createForClass(Group);
GroupSchema.index({ slug: 1 }, { unique: true, name: 'uniq_slug' });
GroupSchema.index({ ownerId: 1 });

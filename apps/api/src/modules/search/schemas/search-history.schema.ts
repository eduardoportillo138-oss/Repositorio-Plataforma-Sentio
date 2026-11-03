import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

/** Historial de búsquedas recientes del usuario (se borra solo a los 90 días). */
@Schema({ collection: 'search_history', timestamps: true })
export class SearchHistory {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, maxlength: 200 })
  query!: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export type SearchHistoryDocument = HydratedDocument<SearchHistory>;

export const SearchHistorySchema = SchemaFactory.createForClass(SearchHistory);
SearchHistorySchema.index({ userId: 1, createdAt: -1 });
SearchHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

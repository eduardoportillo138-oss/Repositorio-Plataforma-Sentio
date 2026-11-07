import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SEARCH_QUERY_MAX_LENGTH } from '@sentio/core';
import { type HydratedDocument, Types } from 'mongoose';

/** Historial de búsquedas recientes del usuario (se borra solo a los 90 días). */
@Schema({ collection: 'search_history', timestamps: true })
export class SearchHistory {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  userId!: Types.ObjectId;

  /** Tal como la escribió el usuario (recortada). Es lo que se muestra. */
  @Prop({ required: true, maxlength: SEARCH_QUERY_MAX_LENGTH })
  query!: string;

  /** Normalizada: evita guardar "José" y "jose" como dos búsquedas distintas. */
  @Prop({ required: true, maxlength: SEARCH_QUERY_MAX_LENGTH })
  normalized!: string;

  /**
   * Última vez que se buscó. Ordena la lista y lleva el TTL. (No se usa `createdAt` porque
   * Mongoose lo trata como inmutable y un `$set` sobre él se descarta sin error.)
   */
  @Prop({ type: Date, required: true })
  lastSearchedAt!: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export type SearchHistoryDocument = HydratedDocument<SearchHistory>;

export const SearchHistorySchema = SchemaFactory.createForClass(SearchHistory);
SearchHistorySchema.index({ userId: 1, lastSearchedAt: -1 }, { name: 'user_lastSearchedAt' });
SearchHistorySchema.index({ userId: 1, normalized: 1 }, { unique: true, name: 'uniq_user_query' });
// 90 días desde la última vez que se buscó (repetir una búsqueda renueva el plazo).
SearchHistorySchema.index(
  { lastSearchedAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90, name: 'ttl_lastSearchedAt' },
);

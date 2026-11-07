import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { searchQuerySchema } from '@sentio/core';
import { Model, Types } from 'mongoose';
import { z } from 'zod';
import { type Connection } from '../../common/pagination/connection.type';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { type PostModel } from '../posts/dto/post.dto';
import { type PublicUserModel } from '../users/dto/public-user.model';
import { type RecentSearchModel, toRecentSearch } from './dto/recent-search.dto';
import {
  SEARCH_PROVIDER,
  type SearchPageArgs,
  type SearchProvider,
} from './providers/search-provider';
import { SearchHistory } from './schemas/search-history.schema';

const queryPipe = new ZodValidationPipe(z.object({ query: searchQuerySchema }));

export const RECENT_SEARCHES_LIMIT = 10;

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectModel(SearchHistory.name) private readonly history: Model<SearchHistory>,
    @Inject(SEARCH_PROVIDER) private readonly provider: SearchProvider,
  ) {}

  async searchUsers(
    userId: string,
    raw: string,
    args: SearchPageArgs,
  ): Promise<Connection<PublicUserModel>> {
    const query = this.validate(raw);
    if (!args.after) await this.remember(userId, raw, query);
    return this.provider.searchUsers(query, args);
  }

  async searchPosts(
    userId: string,
    raw: string,
    args: SearchPageArgs,
  ): Promise<Connection<PostModel>> {
    const query = this.validate(raw);
    if (!args.after) await this.remember(userId, raw, query);
    return this.provider.searchPosts(query, args);
  }

  async recent(userId: string, limit = RECENT_SEARCHES_LIMIT): Promise<RecentSearchModel[]> {
    const docs = await this.history
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ lastSearchedAt: -1, _id: -1 })
      .limit(Math.min(Math.max(limit, 1), 20))
      .lean<SearchHistory[]>()
      .exec();
    return docs.map(toRecentSearch);
  }

  async clear(userId: string): Promise<boolean> {
    await this.history.deleteMany({ userId: new Types.ObjectId(userId) }).exec();
    return true;
  }

  /** Devuelve la consulta normalizada o lanza BAD_USER_INPUT con fieldErrors.query. */
  private validate(raw: string): string {
    return queryPipe.transform({ query: raw }).query;
  }

  /**
   * Guarda la búsqueda (solo la primera página) sin duplicados: repetirla actualiza el texto
   * mostrado y renueva la fecha. Un fallo aquí no debe impedir buscar.
   */
  private async remember(userId: string, raw: string, normalized: string): Promise<void> {
    try {
      await this.history
        .updateOne(
          { userId: new Types.ObjectId(userId), normalized },
          { $set: { query: raw.trim().replace(/\s+/g, ' '), lastSearchedAt: new Date() } },
          { upsert: true },
        )
        .exec();
    } catch (error) {
      this.logger.warn(`No se pudo guardar la búsqueda reciente: ${String(error)}`);
    }
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SearchHistory } from './schemas/search-history.schema';

@Injectable()
export class SearchService {
  constructor(@InjectModel(SearchHistory.name) private readonly model: Model<SearchHistory>) {}

  async findById(id: string): Promise<SearchHistory | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.model.findById(id).lean<SearchHistory>().exec();
  }

  // TODO(Etapa 1): búsqueda de usuarios, grupos y posts con índices de Atlas Search; historial reciente.
}

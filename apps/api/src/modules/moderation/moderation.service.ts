import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report } from './schemas/report.schema';

@Injectable()
export class ModerationService {
  constructor(@InjectModel(Report.name) private readonly model: Model<Report>) {}

  async findById(id: string): Promise<Report | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.model.findById(id).lean<Report>().exec();
  }

  // TODO(Etapa 1): reportes de contenido, cola de moderación por grupo (rol moderator) y acciones.
}

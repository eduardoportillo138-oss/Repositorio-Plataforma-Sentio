import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(@InjectModel(Notification.name) private readonly model: Model<Notification>) {}

  async findById(id: string): Promise<Notification | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.model.findById(id).lean<Notification>().exec();
  }

  // TODO(Etapa 1): crear notificaciones desde la cola, marcarlas como leídas y emitir notification:created.
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from './schemas/message.schema';

@Injectable()
export class ChatService {
  constructor(@InjectModel(Message.name) private readonly model: Model<Message>) {}

  async findById(id: string): Promise<Message | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.model.findById(id).lean<Message>().exec();
  }

  // TODO(Etapa 1): conversaciones 1:1 y de grupo, envío de mensajes y eventos Socket.IO (chat:message).
}

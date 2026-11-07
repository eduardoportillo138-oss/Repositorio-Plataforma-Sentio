import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type ClientSession, Model, Types } from 'mongoose';
import { type Connection } from '../../common/pagination/connection.type';
import { paginate } from '../../common/pagination/paginate';
import { RealtimeGateway } from '../../gateways/realtime.gateway';
import { type NotificationModel, toNotificationModel } from './dto/notification.dto';
import { Notification, type NotificationType } from './schemas/notification.schema';

export interface NewNotification {
  userId: Types.ObjectId | string;
  type: NotificationType;
  actorId?: Types.ObjectId | string | null;
  entity?: { kind: string; id: Types.ObjectId | string } | null;
  message?: string | null;
}

const oid = (v: Types.ObjectId | string) => (typeof v === 'string' ? new Types.ObjectId(v) : v);

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name) private readonly model: Model<Notification>,
    private readonly gateway: RealtimeGateway,
  ) {}

  async findById(id: string): Promise<Notification | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.model.findById(id).lean<Notification>().exec();
  }

  /** Inserta notificaciones (opcionalmente dentro de una transacción). No emite eventos. */
  async createMany(
    items: readonly NewNotification[],
    session?: ClientSession,
  ): Promise<Notification[]> {
    if (items.length === 0) return [];
    const docs = await this.model.insertMany(
      items.map((n) => ({
        userId: oid(n.userId),
        type: n.type,
        actorId: n.actorId ? oid(n.actorId) : null,
        entity: n.entity ? { kind: n.entity.kind, id: oid(n.entity.id) } : null,
        message: n.message ?? null,
      })),
      { session },
    );
    return docs.map((d) => d.toObject());
  }

  /**
   * Avisa por Socket.IO a la sala de cada destinatario. Llamar DESPUÉS de confirmar la
   * transacción, para no anunciar algo que luego se revierte.
   */
  emitCreated(docs: readonly Notification[]): void {
    for (const doc of docs) {
      try {
        if (!this.gateway.server) continue;
        this.gateway.emitToUser(doc.userId.toHexString(), 'notification:created', {
          id: doc._id.toHexString(),
          type: doc.type,
          createdAt: doc.createdAt.toISOString(),
        });
      } catch (error) {
        this.logger.warn(`No se pudo emitir notification:created: ${String(error)}`);
      }
    }
  }

  list(
    userId: string,
    args: { first?: number | null; after?: string | null },
  ): Promise<Connection<NotificationModel>> {
    return paginate(this.model, toNotificationModel, {
      filter: { userId: new Types.ObjectId(userId) },
      sortField: 'createdAt',
      direction: -1,
      first: args.first,
      after: args.after,
    });
  }

  unreadCount(userId: string): Promise<number> {
    return this.model.countDocuments({ userId: new Types.ObjectId(userId), readAt: null }).exec();
  }

  /** Marca como leídas las indicadas (o todas). Devuelve cuántas cambiaron. */
  async markRead(userId: string, ids?: readonly string[] | null): Promise<number> {
    const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId), readAt: null };
    if (ids && ids.length > 0) {
      filter._id = {
        $in: ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id)),
      };
    }
    const res = await this.model.updateMany(filter, { $set: { readAt: new Date() } }).exec();
    return res.modifiedCount;
  }
}

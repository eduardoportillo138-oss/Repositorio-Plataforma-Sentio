import { type Model, Types } from 'mongoose';
import { type RealtimeGateway } from '../../gateways/realtime.gateway';
import { NotificationsService } from './notifications.service';
import { type Notification } from './schemas/notification.schema';

const doc = (): Notification =>
  ({
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    type: 'share',
    createdAt: new Date('2026-11-06T10:00:00Z'),
  }) as Notification;

function setup(gateway: Partial<RealtimeGateway>) {
  const insertMany = jest.fn();
  const service = new NotificationsService(
    { insertMany } as unknown as Model<Notification>,
    gateway as RealtimeGateway,
  );
  return { service, insertMany };
}

describe('NotificationsService', () => {
  it('createMany sin elementos no escribe', async () => {
    const { service, insertMany } = setup({});
    await expect(service.createMany([])).resolves.toEqual([]);
    expect(insertMany).not.toHaveBeenCalled();
  });

  it('emitCreated avisa a la sala de cada destinatario', () => {
    const emitToUser = jest.fn();
    const { service } = setup({ server: {} as never, emitToUser });
    const n = doc();
    service.emitCreated([n]);
    expect(emitToUser).toHaveBeenCalledWith(n.userId.toHexString(), 'notification:created', {
      id: n._id.toHexString(),
      type: 'share',
      createdAt: '2026-11-06T10:00:00.000Z',
    });
  });

  it('sin servidor de sockets (proceso de workers) no emite', () => {
    const emitToUser = jest.fn();
    const { service } = setup({ server: undefined, emitToUser });
    service.emitCreated([doc()]);
    expect(emitToUser).not.toHaveBeenCalled();
  });

  it('un fallo al emitir no se propaga', () => {
    const { service } = setup({
      server: {} as never,
      emitToUser: () => {
        throw new Error('socket roto');
      },
    });
    expect(() => service.emitCreated([doc()])).not.toThrow();
  });
});

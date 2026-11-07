import { Types } from 'mongoose';
import { type GqlContext } from '../../common/graphql/context';
import { toNotificationModel } from './dto/notification.dto';
import { NotificationsResolver } from './notifications.resolver';
import { type NotificationsService } from './notifications.service';
import { type Notification } from './schemas/notification.schema';

const base = {
  _id: new Types.ObjectId(),
  userId: new Types.ObjectId(),
  type: 'share',
  createdAt: new Date(),
} as Notification;

describe('notificaciones (casos límite)', () => {
  const resolver = new NotificationsResolver({} as NotificationsService);
  const loadPost = jest.fn();
  const ctx = {
    loaders: {
      userById: { load: jest.fn().mockResolvedValue({ status: 'suspended' }) },
      postById: { load: loadPost },
    },
  } as unknown as GqlContext;
  const viewer = { userId: new Types.ObjectId().toHexString(), sessionId: 's' };

  it('toNotificationModel tolera actor, entidad y mensaje ausentes', () => {
    expect(toNotificationModel(base)).toMatchObject({
      actorId: null,
      entity: null,
      message: null,
      readAt: null,
    });
  });

  it('sin actor, o con el actor suspendido, actor es null', async () => {
    await expect(resolver.actor(toNotificationModel(base), ctx)).resolves.toBeNull();
    const withActor = toNotificationModel({ ...base, actorId: new Types.ObjectId() });
    await expect(resolver.actor(withActor, ctx)).resolves.toBeNull();
  });

  it('post es null si la entidad no es un post', async () => {
    const group = toNotificationModel({
      ...base,
      entity: { kind: 'group', id: new Types.ObjectId() },
    });
    await expect(resolver.post(group, viewer, ctx)).resolves.toBeNull();
    expect(loadPost).not.toHaveBeenCalled();
  });
});

import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../../common/pagination/connection.type';
import { type Notification, type NotificationType } from '../schemas/notification.schema';

@ObjectType('Notification')
export class NotificationModel {
  @Field(() => ID)
  id!: string;

  @Field({ description: 'share, comment, reaction…' })
  type!: NotificationType;

  @Field(() => String, { nullable: true })
  message!: string | null;

  @Field(() => Date, { nullable: true })
  readAt!: Date | null;

  @Field()
  createdAt!: Date;

  /** Internos para los field resolvers `actor` y `post`. */
  readonly actorId!: string | null;
  readonly entity!: { kind: string; id: string } | null;
}

@ObjectType()
export class NotificationConnection extends Paginated(NotificationModel, 'Notification') {}

export function toNotificationModel(doc: Notification): NotificationModel {
  return {
    id: doc._id.toHexString(),
    type: doc.type,
    message: doc.message ?? null,
    readAt: doc.readAt ?? null,
    createdAt: doc.createdAt,
    actorId: doc.actorId ? doc.actorId.toHexString() : null,
    entity: doc.entity ? { kind: doc.entity.kind, id: doc.entity.id.toHexString() } : null,
  };
}

import { Field, ID, ObjectType } from '@nestjs/graphql';

// Etapa 0: tipos base. Se amplían en la Etapa 1.
@ObjectType('Notification')
export class NotificationModel {
  @Field(() => ID)
  id!: string;

  @Field()
  type!: string;

  @Field(() => ID, { nullable: true })
  actorId!: string | null;

  @Field(() => Date, { nullable: true })
  readAt!: Date | null;

  @Field()
  createdAt!: Date;
}

import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';

// Etapa 0: tipos base. Se amplían en la Etapa 1.
@ObjectType('Message')
export class MessageModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  conversationId!: string;

  @Field(() => ID)
  senderId!: string;

  @Field()
  text!: string;

  @Field()
  createdAt!: Date;
}

@InputType()
export class SendMessageInput {
  @Field(() => ID)
  conversationId!: string;

  @Field()
  text!: string;
}

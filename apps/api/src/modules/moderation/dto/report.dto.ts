import { Field, ID, InputType } from '@nestjs/graphql';

// Etapa 0: tipos base. Se amplían en la Etapa 1.
@InputType()
export class CreateReportInput {
  @Field()
  targetType!: string;

  @Field(() => ID)
  targetId!: string;

  @Field()
  reason!: string;
}

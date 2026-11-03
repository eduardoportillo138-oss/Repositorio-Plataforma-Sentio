import { Field, ID, InputType } from '@nestjs/graphql';

// Etapa 0: tipos base. Se amplían en la Etapa 1.
@InputType()
export class ReactInput {
  @Field()
  targetType!: string;

  @Field(() => ID)
  targetId!: string;

  @Field({ defaultValue: 'like' })
  type!: string;
}

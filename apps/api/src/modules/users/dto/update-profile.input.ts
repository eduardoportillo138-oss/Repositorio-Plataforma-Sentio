import { Field, InputType } from '@nestjs/graphql';

/** Validación en `updateProfileSchema` de @sentio/core. */
@InputType()
export class UpdateProfileInput {
  @Field({ nullable: true })
  displayName?: string;

  @Field(() => String, { nullable: true })
  bio?: string | null;

  @Field(() => String, { nullable: true })
  avatarUrl?: string | null;
}

import { Field, InputType } from '@nestjs/graphql';

/** Validación en `updateProfileSchema` de @sentio/core. La foto se cambia con requestAvatarUpload. */
@InputType()
export class UpdateProfileInput {
  @Field({ nullable: true })
  displayName?: string;

  @Field(() => String, { nullable: true, description: 'Hasta 300 caracteres; null la borra.' })
  bio?: string | null;

  @Field(() => [String], {
    nullable: true,
    description: 'Hasta 3 claves de profileQualities, sin repetir.',
  })
  tags?: string[];
}

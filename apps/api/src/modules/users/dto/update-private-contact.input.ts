import { Field, InputType } from '@nestjs/graphql';

/**
 * Validación en `privateContactSchema` de @sentio/core.
 * Campo omitido = no cambia; null o cadena vacía = se borra.
 */
@InputType()
export class UpdatePrivateContactInput {
  @Field(() => String, { nullable: true, description: 'Formato E.164, p. ej. +525512345678.' })
  phone?: string | null;

  @Field(() => String, { nullable: true })
  altEmail?: string | null;

  @Field(() => String, { nullable: true })
  institution?: string | null;

  @Field(() => String, { nullable: true })
  studentId?: string | null;

  @Field(() => String, { nullable: true })
  emergencyContactName?: string | null;

  @Field(() => String, { nullable: true, description: 'Formato E.164.' })
  emergencyContactPhone?: string | null;
}

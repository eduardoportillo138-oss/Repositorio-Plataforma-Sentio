import { Field, InputType } from '@nestjs/graphql';

/** La validación real está en `registerSchema` de @sentio/core (compartida con web y móvil). */
@InputType()
export class RegisterInput {
  @Field()
  email!: string;

  @Field()
  password!: string;

  @Field()
  handle!: string;

  @Field()
  displayName!: string;

  @Field({
    description: 'Aceptación expresa del Aviso de Privacidad vigente (LFPDPPP). Debe ser true.',
  })
  acceptPrivacyNotice!: boolean;

  @Field({ nullable: true, description: 'Consentimiento opcional para finalidades secundarias.' })
  marketingOptIn?: boolean;

  @Field({ nullable: true, description: 'Idioma preferido: es (por defecto) o en.' })
  locale?: string;
}

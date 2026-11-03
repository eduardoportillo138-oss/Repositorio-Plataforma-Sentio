import { Field, ObjectType } from '@nestjs/graphql';
import { UserModel } from '../../users/dto/user.model';

@ObjectType('AuthPayload')
export class AuthPayloadModel {
  @Field({ description: 'JWT de acceso (15 min). Enviar como Authorization: Bearer <token>.' })
  accessToken!: string;

  @Field()
  accessTokenExpiresAt!: Date;

  @Field(() => String, {
    nullable: true,
    description:
      'Refresh token opaco (30 días, rotativo). Es null para clientes web (header x-client: web), ' +
      'que lo reciben en una cookie httpOnly.',
  })
  refreshToken!: string | null;

  @Field()
  refreshTokenExpiresAt!: Date;

  @Field(() => UserModel)
  user!: UserModel;
}

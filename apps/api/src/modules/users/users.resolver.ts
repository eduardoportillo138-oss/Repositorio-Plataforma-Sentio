import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import {
  handleSchema,
  type PrivateContactData,
  privateContactSchema,
  PROFILE_QUALITIES,
  type UpdateProfileInput as UpdateProfileData,
  updateProfileSchema,
} from '@sentio/core';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { type AuthUser } from '../../common/graphql/context';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { UpdatePrivateContactInput } from './dto/update-private-contact.input';
import { UpdateProfileInput } from './dto/update-profile.input';
import {
  ConsentsModel,
  PrivateContactModel,
  ProfileQualityModel,
  toUserModel,
  UserModel,
} from './dto/user.model';
import { UsersService } from './users.service';

/** El dueño del perfil es el único que ve sus datos privados. */
function isSelf(user: UserModel, viewer: AuthUser | null): boolean {
  return viewer?.userId === user.id;
}

@Resolver(() => UserModel)
export class UsersResolver {
  constructor(private readonly users: UsersService) {}

  @Query(() => UserModel, { nullable: true, description: 'Perfil público por handle.' })
  async user(
    @Args('handle', { type: () => String }, new ZodValidationPipe(handleSchema)) handle: string,
  ): Promise<UserModel | null> {
    const doc = await this.users.findByHandle(handle);
    return doc && doc.status === 'active' ? toUserModel(doc) : null;
  }

  @Public()
  @Query(() => [ProfileQualityModel], {
    description: 'Catálogo de cualidades para las etiquetas del perfil (el cliente las traduce).',
  })
  profileQualities(): ProfileQualityModel[] {
    return PROFILE_QUALITIES.map((key) => ({ key }));
  }

  @Mutation(() => UserModel, { description: 'Actualiza nombre, biografía y cualidades.' })
  async updateProfile(
    @CurrentUser() viewer: AuthUser,
    @Args('input', { type: () => UpdateProfileInput }, new ZodValidationPipe(updateProfileSchema))
    input: UpdateProfileData,
  ): Promise<UserModel> {
    return toUserModel(await this.users.updateProfile(viewer.userId, input));
  }

  @Mutation(() => UserModel, { description: 'Actualiza los datos de contacto privados.' })
  async updatePrivateContact(
    @CurrentUser() viewer: AuthUser,
    @Args(
      'input',
      { type: () => UpdatePrivateContactInput },
      new ZodValidationPipe(privateContactSchema),
    )
    input: PrivateContactData,
  ): Promise<UserModel> {
    return toUserModel(await this.users.updatePrivateContact(viewer.userId, input));
  }

  @Mutation(() => UserModel, {
    description: 'Otorga o revoca el consentimiento para finalidades secundarias (marketing).',
  })
  async updateMarketingConsent(
    @CurrentUser() viewer: AuthUser,
    @Args('optIn') optIn: boolean,
  ): Promise<UserModel> {
    return toUserModel(await this.users.updateMarketingConsent(viewer.userId, optIn));
  }

  @ResolveField(() => String, {
    nullable: true,
    description: 'Solo visible para el propio usuario.',
  })
  email(
    @Parent() user: UserModel,
    @CurrentUser({ optional: true }) viewer: AuthUser | null,
  ): string | null {
    return isSelf(user, viewer) ? user.private.email : null;
  }

  @ResolveField(() => ConsentsModel, {
    nullable: true,
    description: 'Solo visible para el propio usuario.',
  })
  consents(
    @Parent() user: UserModel,
    @CurrentUser({ optional: true }) viewer: AuthUser | null,
  ): ConsentsModel | null {
    return isSelf(user, viewer) ? user.private.consents : null;
  }

  @ResolveField(() => PrivateContactModel, {
    nullable: true,
    description: 'Solo visible para el propio usuario; para cualquier otro es null.',
  })
  privateContact(
    @Parent() user: UserModel,
    @CurrentUser({ optional: true }) viewer: AuthUser | null,
  ): PrivateContactModel | null {
    return isSelf(user, viewer) ? user.private.privateContact : null;
  }
}

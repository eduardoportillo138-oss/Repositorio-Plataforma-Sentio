import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import {
  handleSchema,
  type UpdateProfileInput as UpdateProfileData,
  updateProfileSchema,
} from '@sentio/core';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { type AuthUser } from '../../common/graphql/context';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { UpdateProfileInput } from './dto/update-profile.input';
import { ConsentsModel, toUserModel, UserModel } from './dto/user.model';
import { UsersService } from './users.service';

@Resolver(() => UserModel)
export class UsersResolver {
  constructor(private readonly users: UsersService) {}

  @Query(() => UserModel, { nullable: true, description: 'Perfil público por handle.' })
  async user(
    @Args('handle', { type: () => String }, new ZodValidationPipe(handleSchema)) handle: string,
  ): Promise<UserModel | null> {
    const doc = await this.users.findByHandle(handle);
    return doc ? toUserModel(doc) : null;
  }

  @Mutation(() => UserModel)
  async updateProfile(
    @CurrentUser() viewer: AuthUser,
    @Args('input', { type: () => UpdateProfileInput }, new ZodValidationPipe(updateProfileSchema))
    input: UpdateProfileData,
  ): Promise<UserModel> {
    return toUserModel(await this.users.updateProfile(viewer.userId, input));
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
    return viewer?.userId === user.id ? user.private.email : null;
  }

  @ResolveField(() => ConsentsModel, {
    nullable: true,
    description: 'Solo visible para el propio usuario.',
  })
  consents(
    @Parent() user: UserModel,
    @CurrentUser({ optional: true }) viewer: AuthUser | null,
  ): ConsentsModel | null {
    return viewer?.userId === user.id ? user.private.consents : null;
  }
}

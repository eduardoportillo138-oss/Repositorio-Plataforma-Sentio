import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  type LoginInput as LoginData,
  loginSchema,
  type RegisterData,
  registerSchema,
} from '@sentio/core';
import { type CookieOptions } from 'express';
import { AuthRateLimit } from '../../common/decorators/auth-rate-limit.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Errors } from '../../common/errors/app-error';
import { type AppRequest, type AuthUser, type GqlContext } from '../../common/graphql/context';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AppConfigService } from '../../config/app-config.service';
import { toUserModel, UserModel } from '../users/dto/user.model';
import { UsersService } from '../users/users.service';
import { type AuthResult, AuthService } from './auth.service';
import { AuthPayloadModel } from './dto/auth-payload.model';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';
import { type ClientMeta } from './sessions.service';

/** Header con el que la web pide recibir el refresh token en cookie httpOnly en vez del body. */
export const CLIENT_HEADER = 'x-client';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly config: AppConfigService,
  ) {}

  @Public()
  @AuthRateLimit()
  @Mutation(() => AuthPayloadModel)
  async register(
    @Args('input', { type: () => RegisterInput }, new ZodValidationPipe(registerSchema))
    input: RegisterData,
    @Context() ctx: GqlContext,
  ): Promise<AuthPayloadModel> {
    return this.respond(ctx, await this.auth.register(input, clientMeta(ctx.req)));
  }

  @Public()
  @AuthRateLimit()
  @Mutation(() => AuthPayloadModel)
  async login(
    @Args('input', { type: () => LoginInput }, new ZodValidationPipe(loginSchema)) input: LoginData,
    @Context() ctx: GqlContext,
  ): Promise<AuthPayloadModel> {
    return this.respond(ctx, await this.auth.login(input, clientMeta(ctx.req)));
  }

  @Public()
  @AuthRateLimit()
  @Mutation(() => AuthPayloadModel, {
    description:
      'Canjea un refresh token por un par nuevo. Si se omite `token`, se lee de la cookie.',
  })
  async refreshToken(
    @Args('token', { type: () => String, nullable: true }) token: string | null,
    @Context() ctx: GqlContext,
  ): Promise<AuthPayloadModel> {
    const presented = token ?? this.readCookie(ctx.req);
    if (!presented) throw Errors.refreshTokenInvalid();
    try {
      return this.respond(ctx, await this.auth.refresh(presented, clientMeta(ctx.req)));
    } catch (error) {
      this.clearCookie(ctx);
      throw error;
    }
  }

  @Mutation(() => Boolean, { description: 'Cierra la sesión actual o todas (allDevices).' })
  async logout(
    @CurrentUser() viewer: AuthUser,
    @Args('allDevices', { type: () => Boolean, defaultValue: false }) allDevices: boolean,
    @Context() ctx: GqlContext,
  ): Promise<boolean> {
    await this.auth.logout(viewer.userId, viewer.sessionId, allDevices);
    this.clearCookie(ctx);
    return true;
  }

  @Query(() => UserModel, { description: 'Usuario autenticado.' })
  async me(@CurrentUser() viewer: AuthUser): Promise<UserModel> {
    const user = await this.users.findById(viewer.userId);
    if (!user) throw Errors.unauthenticated();
    return toUserModel(user);
  }

  private respond(ctx: GqlContext, result: AuthResult): AuthPayloadModel {
    // A partir de aquí el solicitante ya es este usuario: los field resolvers privados
    // (email, consents) de `AuthPayload.user` deben verlo como propio.
    ctx.req.user = { userId: result.user._id.toHexString(), sessionId: result.sessionId };
    const isWeb = ctx.req.headers[CLIENT_HEADER] === 'web';
    if (isWeb) {
      ctx.res.cookie(this.config.get('REFRESH_COOKIE_NAME'), result.refreshToken, {
        ...this.cookieOptions(),
        expires: result.refreshTokenExpiresAt,
      });
    }
    return {
      accessToken: result.accessToken,
      accessTokenExpiresAt: result.accessTokenExpiresAt,
      refreshToken: isWeb ? null : result.refreshToken,
      refreshTokenExpiresAt: result.refreshTokenExpiresAt,
      user: toUserModel(result.user),
    };
  }

  private readCookie(req: AppRequest): string | null {
    const cookies = req.cookies as Record<string, string | undefined> | undefined;
    return cookies?.[this.config.get('REFRESH_COOKIE_NAME')] ?? null;
  }

  private clearCookie(ctx: GqlContext): void {
    ctx.res.clearCookie(this.config.get('REFRESH_COOKIE_NAME'), this.cookieOptions());
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.get('COOKIE_SECURE'),
      sameSite: 'lax',
      path: '/graphql',
    };
  }
}

function clientMeta(req: AppRequest): ClientMeta {
  const ua = req.headers['user-agent'];
  return { ip: req.ip ?? null, userAgent: typeof ua === 'string' ? ua.slice(0, 512) : null };
}

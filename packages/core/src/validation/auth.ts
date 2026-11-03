import { z } from 'zod';
import { displayNameSchema, handleSchema } from './user';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: 'validation.email.invalid' }));

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, { message: 'validation.password.min' })
  .max(PASSWORD_MAX_LENGTH, { message: 'validation.password.max' })
  .regex(/[A-Za-z]/, { message: 'validation.password.letter' })
  .regex(/\d/, { message: 'validation.password.digit' });

export const supportedLocales = ['es', 'en'] as const;
export const localeSchema = z.enum(supportedLocales);
export type Locale = z.infer<typeof localeSchema>;

/**
 * Registro. Conforme a la LFPDPPP, el titular debe aceptar expresamente el Aviso de Privacidad
 * (finalidades primarias) y puede negarse a las finalidades secundarias (marketing).
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  handle: handleSchema,
  displayName: displayNameSchema,
  acceptPrivacyNotice: z.literal(true, { message: 'validation.privacy.required' }),
  marketingOptIn: z.boolean().default(false),
  locale: localeSchema.default('es'),
});

export type RegisterInput = z.input<typeof registerSchema>;
export type RegisterData = z.output<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: 'validation.password.required' }).max(PASSWORD_MAX_LENGTH),
});

export type LoginInput = z.infer<typeof loginSchema>;

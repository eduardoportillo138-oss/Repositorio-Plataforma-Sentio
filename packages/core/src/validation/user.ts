import { z } from 'zod';
import { tagsSchema } from '../profile/qualities';

export const HANDLE_REGEX = /^[a-z0-9_]{3,30}$/;

export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(HANDLE_REGEX, { message: 'validation.handle.format' });

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, { message: 'validation.displayName.required' })
  .max(60, { message: 'validation.displayName.max' });

export const BIO_MAX_LENGTH = 300;

export const bioSchema = z.string().trim().max(BIO_MAX_LENGTH, { message: 'validation.bio.max' });

export const updateProfileSchema = z
  .object({
    displayName: displayNameSchema.optional(),
    bio: bioSchema.nullable().optional(),
    tags: tagsSchema.optional(),
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// --- Información de contacto privada -------------------------------------------------------

/** Teléfono en formato E.164: + y de 8 a 15 dígitos, sin espacios (p. ej. +525512345678). */
export const E164_REGEX = /^\+[1-9]\d{7,14}$/;

/** Las cadenas vacías (o solo espacios) se guardan como `null` para borrar el dato. */
const blankToNull = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? null : value;

const optionalText = (max: number, key: string) =>
  z.preprocess(
    blankToNull,
    z
      .string()
      .trim()
      .max(max, { message: `validation.${key}.max` })
      .nullable()
      .optional(),
  );

const optionalPhone = (key: string) =>
  z.preprocess(
    (v) => (typeof v === 'string' ? blankToNull(v.replace(/[\s()-]/g, '')) : v),
    z
      .string()
      .regex(E164_REGEX, { message: `validation.${key}.format` })
      .nullable()
      .optional(),
  );

export const privateContactSchema = z
  .object({
    phone: optionalPhone('phone'),
    altEmail: z.preprocess(
      blankToNull,
      z
        .string()
        .trim()
        .toLowerCase()
        .pipe(z.email({ message: 'validation.email.invalid' }))
        .nullable()
        .optional(),
    ),
    institution: optionalText(120, 'institution'),
    studentId: optionalText(40, 'studentId'),
    emergencyContactName: optionalText(80, 'emergencyContactName'),
    emergencyContactPhone: optionalPhone('phone'),
  })
  .strict();

export type PrivateContactInput = z.input<typeof privateContactSchema>;
export type PrivateContactData = z.output<typeof privateContactSchema>;

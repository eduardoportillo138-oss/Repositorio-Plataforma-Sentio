import { z } from 'zod';

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

export const bioSchema = z.string().trim().max(280, { message: 'validation.bio.max' });

export const avatarUrlSchema = z.url({ protocol: /^https?$/, message: 'validation.url.invalid' });

export const updateProfileSchema = z
  .object({
    displayName: displayNameSchema.optional(),
    bio: bioSchema.nullable().optional(),
    avatarUrl: avatarUrlSchema.nullable().optional(),
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

import { z } from 'zod';

export const AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'] as const;
export type AvatarMimeType = (typeof AVATAR_MIME_TYPES)[number];

/** Tamaño máximo del archivo original de la foto de perfil: 5 MB. */
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

/** Vigencia de la URL prefirmada de subida. */
export const UPLOAD_URL_TTL_SECONDS = 10 * 60;

export const avatarUploadSchema = z.object({
  mimeType: z.enum(AVATAR_MIME_TYPES, { message: 'validation.avatar.type' }),
  sizeBytes: z
    .number()
    .int()
    .positive({ message: 'validation.avatar.empty' })
    .max(AVATAR_MAX_BYTES, { message: 'validation.avatar.size' }),
});

export type AvatarUploadInput = z.infer<typeof avatarUploadSchema>;

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, { message: 'validation.id' });

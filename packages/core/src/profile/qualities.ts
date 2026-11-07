import { z } from 'zod';

/**
 * Catálogo de cualidades que el estudiante puede mostrar en su perfil (máximo 3).
 *
 * Es el ÚNICO lugar donde se definen. Para cambiarlas:
 *   1. Edita esta lista (las claves son estables: se guardan en la base de datos).
 *   2. Agrega/ajusta la traducción `profile.qualities.<clave>` en packages/i18n (es y en).
 * Los clientes obtienen el catálogo con la query `profileQualities`.
 */
export const PROFILE_QUALITIES = [
  'empathetic',
  'creative',
  'curious',
  'organized',
  'sociable',
  'resilient',
  'calm',
  'supportive',
  'analytical',
  'optimistic',
] as const;

export type ProfileQuality = (typeof PROFILE_QUALITIES)[number];

export const MAX_PROFILE_TAGS = 3;

export function isProfileQuality(value: unknown): value is ProfileQuality {
  return typeof value === 'string' && (PROFILE_QUALITIES as readonly string[]).includes(value);
}

export const profileQualitySchema = z.enum(PROFILE_QUALITIES, {
  message: 'validation.tags.unknown',
});

/** Hasta 3 cualidades del catálogo, sin repetidas. */
export const tagsSchema = z
  .array(profileQualitySchema)
  .max(MAX_PROFILE_TAGS, { message: 'validation.tags.max' })
  .refine((tags) => new Set(tags).size === tags.length, { message: 'validation.tags.duplicate' });

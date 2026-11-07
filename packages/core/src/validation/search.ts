import { z } from 'zod';

export const SEARCH_QUERY_MIN_LENGTH = 2;
export const SEARCH_QUERY_MAX_LENGTH = 80;

const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');

/**
 * Normaliza texto para buscar y para los campos `search*` guardados:
 * minúsculas, sin acentos/diacríticos (á → a, ñ → n) y espacios colapsados.
 */
export function normalizeSearchText(value: string): string {
  return (
    value
      .normalize('NFD')
      // Marcas diacríticas combinantes U+0300–U+036F (rango explícito: Hermes no soporta
      // bien \p{…}). Va como cadena para que el formateador no lo convierta en caracteres.
      .replace(COMBINING_MARKS, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/** Escapa los caracteres especiales de una expresión regular. */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Consulta de búsqueda: entre 2 y 80 caracteres (tras recortar). Se devuelve normalizada. */
export const searchQuerySchema = z
  .string()
  .trim()
  .min(SEARCH_QUERY_MIN_LENGTH, { message: 'validation.search.min' })
  .max(SEARCH_QUERY_MAX_LENGTH, { message: 'validation.search.max' })
  .transform(normalizeSearchText)
  .refine((v) => v.length >= SEARCH_QUERY_MIN_LENGTH, { message: 'validation.search.min' });

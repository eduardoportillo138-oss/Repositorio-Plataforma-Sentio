import { normalizeSearchText } from '@sentio/core';

/**
 * Campos normalizados (minúsculas, sin acentos) que se guardan junto a cada documento para
 * buscar sin depender de collations. Nunca se exponen por GraphQL.
 */
export function userSearchName(displayName: string, handle: string): string {
  return normalizeSearchText(`${displayName} ${handle}`);
}

export function postSearchFields(
  title: string,
  text: string,
): { searchTitle: string; searchText: string } {
  return { searchTitle: normalizeSearchText(title), searchText: normalizeSearchText(text) };
}

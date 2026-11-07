import { normalizeSearchText } from '../validation/search';

export interface HighlightRange {
  /** Índice en el texto ORIGINAL (incluido). */
  start: number;
  /** Índice en el texto ORIGINAL (excluido). */
  end: number;
}

/**
 * Normaliza carácter por carácter y guarda, para cada carácter normalizado, de qué posición
 * del texto original viene. Así las coincidencias encontradas sin acentos ni mayúsculas se
 * pueden pintar sobre el texto tal como se escribió.
 */
function normalizedWithMap(text: string): { value: string; map: number[] } {
  let value = '';
  const map: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    // Los espacios se conservan uno a uno para no desalinear las posiciones.
    const n = /\s/.test(ch) ? ' ' : normalizeSearchText(ch);
    for (const c of n) {
      value += c;
      map.push(i);
    }
  }
  return { value, map };
}

/** Palabras de la consulta, normalizadas y sin repetir (las más largas primero). */
function queryTerms(query: string): string[] {
  return [...new Set(normalizeSearchText(query).split(' ').filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  );
}

/**
 * Rangos del texto original que coinciden con alguna palabra de la consulta (ignorando
 * acentos y mayúsculas), ordenados y sin solaparse.
 */
export function highlightRanges(text: string, query: string): HighlightRange[] {
  const terms = queryTerms(query);
  if (!text || terms.length === 0) return [];
  const { value, map } = normalizedWithMap(text);

  const raw: HighlightRange[] = [];
  for (const term of terms) {
    let from = 0;
    for (;;) {
      const at = value.indexOf(term, from);
      if (at === -1) break;
      raw.push({ start: map[at]!, end: map[at + term.length - 1]! + 1 });
      from = at + term.length;
    }
  }

  raw.sort((a, b) => a.start - b.start || b.end - a.end);
  const merged: HighlightRange[] = [];
  for (const r of raw) {
    const last = merged.at(-1);
    if (last && r.start <= last.end) last.end = Math.max(last.end, r.end);
    else merged.push({ ...r });
  }
  return merged;
}

/**
 * Fragmento de unos `maxLength` caracteres alrededor de la primera coincidencia, con "…" donde
 * se recorta. Si no hay coincidencia, el principio del texto.
 */
export function snippetAround(text: string, query: string, maxLength = 160): string {
  if (text.length <= maxLength) return text;
  const first = highlightRanges(text, query)[0];
  const center = first ? first.start : 0;
  let start = Math.max(0, center - Math.floor(maxLength / 3));
  let end = Math.min(text.length, start + maxLength);
  start = Math.max(0, end - maxLength);
  // No cortar palabras a la mitad.
  if (start > 0) {
    const space = text.indexOf(' ', start);
    if (space !== -1 && space < center) start = space + 1;
  }
  if (end < text.length) {
    const space = text.lastIndexOf(' ', end);
    if (space > start && space > center) end = space;
  }
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}

/**
 * Tiempo relativo para mostrar en publicaciones ("hace 5 min"). Es una función pura: el texto
 * lo pone packages/i18n. No usa Intl.RelativeTimeFormat (Hermes no lo trae completo).
 */
export type RelativeTimeParts =
  | { unit: 'now' }
  | { unit: 'minute' | 'hour' | 'day'; value: number }
  | { unit: 'date'; date: Date };

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
/** A partir de esta antigüedad se muestra la fecha. */
const MAX_RELATIVE_DAYS = 7;

export function relativeTimeParts(
  date: Date | string | number,
  now: Date = new Date(),
): RelativeTimeParts {
  const d = date instanceof Date ? date : new Date(date);
  // Relojes desfasados: una fecha "del futuro" se muestra como "ahora".
  const diff = Math.max(0, now.getTime() - d.getTime());

  if (diff < MINUTE) return { unit: 'now' };
  if (diff < HOUR) return { unit: 'minute', value: Math.floor(diff / MINUTE) };
  if (diff < DAY) return { unit: 'hour', value: Math.floor(diff / HOUR) };
  const days = Math.floor(diff / DAY);
  if (days < MAX_RELATIVE_DAYS) return { unit: 'day', value: days };
  return { unit: 'date', date: d };
}

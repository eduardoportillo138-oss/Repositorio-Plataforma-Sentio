import { useCallback } from 'react';
import { relativeTimeParts } from '@sentio/core';
import { useTranslation } from 'react-i18next';

export * from './core';
// La instancia se pasa con <I18nextProvider i18n={createI18n(locale)}>; no se usa un singleton global.
export { I18nextProvider, Trans, useTranslation } from 'react-i18next';

/**
 * Traduce claves que se conocen solo en tiempo de ejecución (p. ej. las que devuelven los
 * errores de la API o de zod). Devuelve `null` si no hay clave.
 */
export function useDynamicT(): (key: string | null | undefined) => string | null {
  const { t } = useTranslation();
  return useCallback((key) => (key ? (t as unknown as (k: string) => string)(key) : null), [t]);
}

/**
 * Formatea fechas como "hace 5 min" / "5 min ago" (y la fecha corta a partir de 7 días).
 * No usa Intl.RelativeTimeFormat, que Hermes no trae completo.
 */
export function useRelativeTime(): (date: Date | string | number, now?: Date) => string {
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  return useCallback(
    (date, now = new Date()) => {
      const parts = relativeTimeParts(date, now);
      switch (parts.unit) {
        case 'now':
          return t('time.now');
        case 'minute':
          return t('time.minutes', { n: String(parts.value) });
        case 'hour':
          return t('time.hours', { n: String(parts.value) });
        case 'day':
          return t('time.days', { n: String(parts.value) });
        case 'date':
          return new Intl.DateTimeFormat(language, {
            day: 'numeric',
            month: 'short',
            ...(parts.date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
          }).format(parts.date);
      }
    },
    [t, language],
  );
}

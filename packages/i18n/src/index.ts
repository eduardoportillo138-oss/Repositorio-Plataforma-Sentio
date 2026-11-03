import { useCallback } from 'react';
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

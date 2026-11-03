import { type Locale, supportedLocales } from '@sentio/core';
import i18next, { type i18n as I18n } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en';
import { es, type Messages } from './locales/es';

export { I18nextProvider, Trans, useTranslation } from 'react-i18next';
export { type Messages } from './locales/es';
export { type Locale, supportedLocales };

export const DEFAULT_LOCALE: Locale = 'es';
export const resources: Record<Locale, { translation: Messages }> = {
  es: { translation: es },
  en: { translation: en },
};

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof es };
  }
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (supportedLocales as readonly string[]).includes(value);
}

/**
 * Elige el idioma a partir de una lista de preferencias (Accept-Language, ajustes del dispositivo…).
 * Cualquier variante regional se reduce a su idioma base (es-MX → es). Por defecto, español.
 */
export function resolveLocale(preferences: readonly (string | null | undefined)[]): Locale {
  for (const pref of preferences) {
    const base = pref?.toLowerCase().split(/[-_]/)[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

/**
 * Crea una instancia aislada de i18next (una por request en SSR, una por app en el cliente).
 * La detección del idioma la hace cada app; este paquete no usa APIs del DOM ni nativas.
 */
export function createI18n(locale: Locale = DEFAULT_LOCALE): I18n {
  const instance = i18next.createInstance();
  void instance.use(initReactI18next).init({
    lng: locale,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: [...supportedLocales],
    resources,
    initImmediate: false,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  return instance;
}

/** Clave de traducción para un código de error de la API (con variante por campo en CONFLICT). */
export function errorMessageKey(code: string | undefined, field?: string): string {
  if (code === 'CONFLICT' && (field === 'email' || field === 'handle'))
    return `errors.CONFLICT_${field}`;
  if (code && code in es.errors) return `errors.${code}`;
  return 'errors.unknown';
}

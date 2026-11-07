'use client';

import { supportedLocales, useTranslation } from '@sentio/i18n';
import { XStack } from '@sentio/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface LanguageSwitcherProps {
  /** Ruta sin el prefijo de idioma (p. ej. `login`). Si falta, se toma de la URL actual. */
  path?: string;
  marginTop?: '$0' | '$3';
}

/** Cambia de idioma conservando la página; recuerda la elección en la cookie NEXT_LOCALE. */
export function LanguageSwitcher({ path, marginTop = '$3' }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();
  const pathname = usePathname();
  // /es/search → search ; /es → ''
  const rest = path ?? pathname.split('/').slice(2).join('/');

  return (
    <XStack gap="$3" marginTop={marginTop} alignItems="center">
      {supportedLocales
        .filter((l) => l !== i18n.language)
        .map((l) => (
          <Link
            key={l}
            href={rest ? `/${l}/${rest}` : `/${l}`}
            hrefLang={l}
            onClick={() => {
              document.cookie = `NEXT_LOCALE=${l}; path=/; max-age=31536000; samesite=lax`;
            }}
          >
            {t(`languages.${l}`)}
          </Link>
        ))}
    </XStack>
  );
}

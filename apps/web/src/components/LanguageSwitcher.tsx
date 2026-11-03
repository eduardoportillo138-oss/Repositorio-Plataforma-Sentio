'use client';

import { supportedLocales, useTranslation } from '@sentio/i18n';
import { XStack } from '@sentio/ui';
import Link from 'next/link';

/** Cambia de idioma conservando la página; recuerda la elección en la cookie NEXT_LOCALE. */
export function LanguageSwitcher({ path }: { path: string }) {
  const { t, i18n } = useTranslation();
  return (
    <XStack gap="$3" marginTop="$3">
      {supportedLocales
        .filter((l) => l !== i18n.language)
        .map((l) => (
          <Link
            key={l}
            href={`/${l}/${path}`}
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

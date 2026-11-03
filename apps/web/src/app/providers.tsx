'use client';

import { createMemoryTokenStorage, SentioApiProvider } from '@sentio/api-client';
import { createI18n, I18nextProvider, type Locale } from '@sentio/i18n';
import { tamaguiConfig, UIProvider } from '@sentio/ui';
import { useServerInsertedHTML } from 'next/navigation';
import { type ReactNode, useMemo, useRef } from 'react';
import { API_URL } from '@/lib/env';

/** Inserta el CSS de Tamagui en el HTML del SSR (una sola vez) para evitar parpadeos. */
function TamaguiSSRStyles() {
  const inserted = useRef(false);
  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    inserted.current = true;
    return <style id="tamagui" dangerouslySetInnerHTML={{ __html: tamaguiConfig.getCSS() }} />;
  });
  return null;
}

export function Providers({ locale, children }: { locale: Locale; children: ReactNode }) {
  const i18n = useMemo(() => createI18n(locale), [locale]);
  // En web el access token vive solo en memoria; el refresh token, en cookie httpOnly.
  const tokens = useMemo(() => createMemoryTokenStorage(), []);

  return (
    <I18nextProvider i18n={i18n}>
      <TamaguiSSRStyles />
      <UIProvider>
        <SentioApiProvider uri={API_URL} platform="web" tokens={tokens}>
          {children}
        </SentioApiProvider>
      </UIProvider>
    </I18nextProvider>
  );
}

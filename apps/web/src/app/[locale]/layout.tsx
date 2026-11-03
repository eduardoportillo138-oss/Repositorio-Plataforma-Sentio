import { isLocale, supportedLocales } from '@sentio/i18n/core';
import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import { type ReactNode } from 'react';
import { Providers } from '../providers';

export const metadata: Metadata = {
  title: 'Sentio',
  description: 'Red social con grupos privados.',
};

export function generateStaticParams() {
  return supportedLocales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale}>
      <body style={{ margin: 0 }}>
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}

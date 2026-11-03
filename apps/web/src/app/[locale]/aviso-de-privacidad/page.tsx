import { createI18n, isLocale } from '@sentio/i18n/core';
import { notFound } from 'next/navigation';
import { PRIVACY_CONTACT } from '@/lib/env';

/**
 * Aviso de Privacidad (LFPDPPP). BORRADOR: el texto integral (responsable, domicilio, datos
 * recabados, finalidades, transferencias, medios ARCO, uso de cookies y cambios al aviso) debe
 * redactarlo y validarlo el área legal antes de producción.
 */
export default async function PrivacyNoticePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const i18n = createI18n(locale);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 24, fontFamily: 'system-ui' }}>
      <h1>{locale === 'es' ? 'Aviso de Privacidad' : 'Privacy Notice'}</h1>
      <p>{i18n.t('auth.privacy.shortNotice', { contact: PRIVACY_CONTACT, url: '' })}</p>
      <p>
        <em>
          {locale === 'es'
            ? 'Versión integral pendiente de revisión legal.'
            : 'Full version pending legal review.'}
        </em>
      </p>
    </main>
  );
}

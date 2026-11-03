'use client';

import { useAuth } from '@sentio/api-client';
import { useTranslation } from '@sentio/i18n';
import { AuthScreen, Button, Paragraph, YStack } from '@sentio/ui';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { t } = useTranslation();
  const { status, viewer, logout } = useAuth();
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  useEffect(() => {
    if (status === 'anonymous') router.replace(`/${locale}/login`);
  }, [status, locale, router]);

  if (status !== 'authenticated' || !viewer) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$6">
        <Paragraph>{t('common.loading')}</Paragraph>
      </YStack>
    );
  }

  return (
    <AuthScreen
      title={t('auth.home.greeting', { name: viewer.displayName })}
      subtitle={t('auth.home.signedInAs', { handle: viewer.handle })}
    >
      <Button tone="ghost" onPress={() => void logout()}>
        {t('auth.home.logout')}
      </Button>
    </AuthScreen>
  );
}

import { useAuth } from '@sentio/api-client';
import { useTranslation } from '@sentio/i18n';
import { AuthScreen, Button, Paragraph, YStack } from '@sentio/ui';
import { Redirect } from 'expo-router';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { status, viewer, logout } = useAuth();

  if (status === 'anonymous') return <Redirect href="/login" />;
  if (status === 'loading' || !viewer) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
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

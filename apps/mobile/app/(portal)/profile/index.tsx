import { useAuth } from '@sentio/api-client';
import { useTranslation } from '@sentio/i18n';
import { Button, EmptyState, ProfileIcon } from '@sentio/ui';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { viewer, logout } = useAuth();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <EmptyState
        icon={ProfileIcon}
        title={t('portal.profile.empty.title', { handle: viewer?.handle ?? '' })}
        body={t('portal.profile.empty.body')}
        action={
          <Button tone="ghost" onPress={() => void logout()}>
            {t('portal.logout')}
          </Button>
        }
      />
    </SafeAreaView>
  );
}

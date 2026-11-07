import { useAuth } from '@sentio/api-client';
import { useTranslation } from '@sentio/i18n';
import { EmptyState, HomeIcon } from '@sentio/ui';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { viewer } = useAuth();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <EmptyState
        icon={HomeIcon}
        title={t('portal.home.empty.title', { name: viewer?.displayName ?? '' })}
        body={t('portal.home.empty.body')}
      />
    </SafeAreaView>
  );
}

import { useTranslation } from '@sentio/i18n';
import { EmptyState, SearchIcon } from '@sentio/ui';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <EmptyState
        icon={SearchIcon}
        title={t('portal.search.empty.title')}
        body={t('portal.search.empty.body')}
      />
    </SafeAreaView>
  );
}

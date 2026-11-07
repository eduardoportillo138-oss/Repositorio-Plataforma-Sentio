'use client';

import { useTranslation } from '@sentio/i18n';
import { EmptyState, SearchIcon } from '@sentio/ui';

export default function SearchPage() {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon={SearchIcon}
      title={t('portal.search.empty.title')}
      body={t('portal.search.empty.body')}
    />
  );
}

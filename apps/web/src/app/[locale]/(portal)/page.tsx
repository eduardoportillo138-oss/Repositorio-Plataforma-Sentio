'use client';

import { useAuth } from '@sentio/api-client';
import { useTranslation } from '@sentio/i18n';
import { EmptyState, HomeIcon } from '@sentio/ui';

export default function HomePage() {
  const { t } = useTranslation();
  const { viewer } = useAuth();

  return (
    <EmptyState
      icon={HomeIcon}
      title={t('portal.home.empty.title', { name: viewer?.displayName ?? '' })}
      body={t('portal.home.empty.body')}
    />
  );
}

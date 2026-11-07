'use client';

import { useAuth } from '@sentio/api-client';
import { useTranslation } from '@sentio/i18n';
import { EmptyState, ProfileIcon } from '@sentio/ui';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { viewer } = useAuth();

  return (
    <EmptyState
      icon={ProfileIcon}
      title={t('portal.profile.empty.title', { handle: viewer?.handle ?? '' })}
      body={t('portal.profile.empty.body')}
    />
  );
}

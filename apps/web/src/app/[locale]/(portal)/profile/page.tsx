'use client';

import { useMeQuery } from '@sentio/api-client';
import { useDynamicT, useTranslation } from '@sentio/i18n';
import {
  Button,
  EditIcon,
  LockIcon,
  PageContainer,
  ProfileHeader,
  Spinner,
  YStack,
} from '@sentio/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { UserAvatar } from '@/components/UserAvatar';
import { UserPostsSection } from '@/components/UserPostsSection';

export default function ProfilePage() {
  const { t } = useTranslation();
  const tr = useDynamicT();
  const { locale } = useParams<{ locale: string }>();
  const { data } = useMeQuery({ fetchPolicy: 'cache-and-network' });
  const me = data?.me;

  if (!me) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$6">
        <Spinner size="large" />
      </YStack>
    );
  }

  return (
    <PageContainer>
      <ProfileHeader
        avatar={<UserAvatar name={me.displayName} avatar={me.avatar} size={128} />}
        displayName={me.displayName}
        handle={me.handle}
        bio={me.bio}
        tags={me.tags.map((k) => tr(`profile.qualities.${k}`) ?? k)}
        emptyBio={t('profile.view.noBio')}
        emptyTags={t('profile.view.noTags')}
        actions={
          <>
            <Link href={`/${locale}/profile/edit`} style={{ textDecoration: 'none' }}>
              <Button tone="primary" icon={<EditIcon size={18} />}>
                {t('profile.view.edit')}
              </Button>
            </Link>
            <Link href={`/${locale}/profile/private`} style={{ textDecoration: 'none' }}>
              <Button tone="ghost" icon={<LockIcon size={18} />}>
                {t('profile.view.privateInfo')}
              </Button>
            </Link>
          </>
        }
      />
      <UserPostsSection handle={me.handle} />
    </PageContainer>
  );
}

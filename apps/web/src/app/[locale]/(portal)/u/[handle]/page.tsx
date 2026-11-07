'use client';

import { useAuth, useUserProfileQuery } from '@sentio/api-client';
import { useDynamicT, useTranslation } from '@sentio/i18n';
import { EmptyState, PageContainer, ProfileHeader, ProfileIcon, Spinner, YStack } from '@sentio/ui';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserAvatar } from '@/components/UserAvatar';

/** Perfil público de otra persona: solo datos públicos (nunca contacto privado ni correo). */
export default function PublicProfilePage() {
  const { t } = useTranslation();
  const tr = useDynamicT();
  const router = useRouter();
  const { viewer } = useAuth();
  const { locale, handle } = useParams<{ locale: string; handle: string }>();
  const { data, loading } = useUserProfileQuery({ variables: { handle } });

  // Mi propio perfil se ve (y edita) en /profile.
  useEffect(() => {
    if (viewer && viewer.handle === handle.toLowerCase()) router.replace(`/${locale}/profile`);
  }, [viewer, handle, locale, router]);

  if (loading && !data) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$6">
        <Spinner size="large" />
      </YStack>
    );
  }

  const user = data?.user;
  if (!user) return <EmptyState icon={ProfileIcon} title={t('profile.view.notFound')} />;

  return (
    <PageContainer>
      <ProfileHeader
        avatar={<UserAvatar name={user.displayName} avatar={user.avatar} size={128} />}
        displayName={user.displayName}
        handle={user.handle}
        bio={user.bio}
        tags={user.tags.map((k) => tr(`profile.qualities.${k}`) ?? k)}
        emptyBio={t('profile.view.noBio')}
      />
    </PageContainer>
  );
}

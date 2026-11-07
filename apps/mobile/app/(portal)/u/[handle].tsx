import { useAuth, useUserProfileQuery } from '@sentio/api-client';
import { useDynamicT, useTranslation } from '@sentio/i18n';
import { EmptyState, PageContainer, ProfileHeader, ProfileIcon, Spinner, YStack } from '@sentio/ui';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ScreenHeader';
import { UserAvatar } from '@/components/UserAvatar';

/** Perfil público de otra persona: solo datos públicos (nunca contacto privado ni correo). */
export default function PublicProfileScreen() {
  const { t } = useTranslation();
  const tr = useDynamicT();
  const { viewer } = useAuth();
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const { data, loading } = useUserProfileQuery({ variables: { handle } });

  if (viewer && viewer.handle === handle.toLowerCase()) return <Redirect href="/profile" />;

  const user = data?.user;
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScreenHeader title={user ? `@${user.handle}` : ''} />
      {loading && !data ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Spinner size="large" />
        </YStack>
      ) : !user ? (
        <EmptyState icon={ProfileIcon} title={t('profile.view.notFound')} />
      ) : (
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
      )}
    </SafeAreaView>
  );
}

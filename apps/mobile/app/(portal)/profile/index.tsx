import { useAuth, useMeQuery } from '@sentio/api-client';
import { useDynamicT, useTranslation } from '@sentio/i18n';
import {
  Button,
  EditIcon,
  LockIcon,
  LogOutIcon,
  PageContainer,
  ProfileHeader,
  Spinner,
  YStack,
} from '@sentio/ui';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserAvatar } from '@/components/UserAvatar';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const tr = useDynamicT();
  const router = useRouter();
  const { logout } = useAuth();
  const { data } = useMeQuery({ fetchPolicy: 'cache-and-network' });
  const me = data?.me;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      {!me ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Spinner size="large" />
        </YStack>
      ) : (
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
                <Button icon={<EditIcon size={18} />} onPress={() => router.push('/profile/edit')}>
                  {t('profile.view.edit')}
                </Button>
                <Button
                  tone="ghost"
                  icon={<LockIcon size={18} />}
                  onPress={() => router.push('/profile/private')}
                >
                  {t('profile.view.privateInfo')}
                </Button>
              </>
            }
          />
          <Button tone="ghost" icon={<LogOutIcon size={18} />} onPress={() => void logout()}>
            {t('portal.logout')}
          </Button>
        </PageContainer>
      )}
    </SafeAreaView>
  );
}

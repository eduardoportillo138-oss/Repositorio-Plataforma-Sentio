import { useAuth, useConnection, useMeQuery, useUserPostsQuery } from '@sentio/api-client';
import { useDynamicT, useTranslation } from '@sentio/i18n';
import {
  Button,
  EditIcon,
  LockIcon,
  LogOutIcon,
  Paragraph,
  ProfileHeader,
  Spinner,
  YStack,
} from '@sentio/ui';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PostList } from '@/components/PostList';
import { UserAvatar } from '@/components/UserAvatar';
import { UserPostsTab } from '@/components/UserPostsTab';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const tr = useDynamicT();
  const router = useRouter();
  const { logout, viewer } = useAuth();
  const { data } = useMeQuery({ fetchPolicy: 'cache-and-network' });
  const me = data?.me;
  const postsQuery = useUserPostsQuery({
    variables: { handle: viewer?.handle ?? '' },
    skip: !viewer,
    notifyOnNetworkStatusChange: true,
  });
  const feed = useConnection(postsQuery, (d) => d.userPosts);

  if (!me) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Spinner size="large" />
      </YStack>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <PostList
        feed={feed}
        header={
          <YStack>
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
                  <Button
                    icon={<EditIcon size={18} />}
                    onPress={() => router.push('/profile/edit')}
                  >
                    {t('profile.view.edit')}
                  </Button>
                  <Button
                    tone="ghost"
                    icon={<LockIcon size={18} />}
                    onPress={() => router.push('/profile/private')}
                  >
                    {t('profile.view.privateInfo')}
                  </Button>
                  <Button
                    tone="ghost"
                    icon={<LogOutIcon size={18} />}
                    onPress={() => void logout()}
                  >
                    {t('portal.logout')}
                  </Button>
                </>
              }
            />
            <UserPostsTab />
          </YStack>
        }
        empty={
          <Paragraph textAlign="center" color="$color10" padding="$6">
            {t('feed.userEmpty')}
          </Paragraph>
        }
      />
    </SafeAreaView>
  );
}

import { useConnection, useHomeFeedQuery, useUnreadNotifications } from '@sentio/api-client';
import { useTranslation } from '@sentio/i18n';
import {
  BellButton,
  EmptyState,
  FloatingActionButton,
  H3,
  HomeIcon,
  PlusIcon,
  XStack,
  YStack,
} from '@sentio/ui';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PostList } from '@/components/PostList';

/** Botón flotante (56) + margen (16) + respiro: espacio libre al final de la lista. */
const FAB_CLEARANCE = 96;

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const query = useHomeFeedQuery({ notifyOnNetworkStatusChange: true });
  const feed = useConnection(query, (d) => d.homeFeed);
  const unread = useUnreadNotifications();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <XStack
        alignItems="center"
        justifyContent="space-between"
        paddingHorizontal="$4"
        paddingVertical="$1"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <H3 color="$blue10">{t('common.appName')}</H3>
        <BellButton
          count={unread}
          label={t('notifications.open', { n: String(unread) })}
          onPress={() => router.push('/notifications')}
        />
      </XStack>
      <YStack flex={1}>
        <PostList
          feed={feed}
          bottomInset={FAB_CLEARANCE}
          empty={
            <EmptyState icon={HomeIcon} title={t('feed.empty.title')} body={t('feed.empty.body')} />
          }
        />
        {/* La barra de pestañas ya respeta la safe area inferior; el botón queda por encima. */}
        <FloatingActionButton
          icon={<PlusIcon size={26} color="white" />}
          label={t('post.newPost')}
          bottom={16}
          onPress={() => router.push('/new-post')}
        />
      </YStack>
    </SafeAreaView>
  );
}

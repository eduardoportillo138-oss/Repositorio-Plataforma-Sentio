'use client';

import { useConnection, useUserPostsQuery } from '@sentio/api-client';
import { useTranslation } from '@sentio/i18n';
import { Paragraph, Text, XStack, YStack } from '@sentio/ui';
import { PostList } from './PostList';

/** Pestaña "Publicaciones" del perfil (propio o ajeno). */
export function UserPostsSection({ handle }: { handle: string }) {
  const { t } = useTranslation();
  const query = useUserPostsQuery({ variables: { handle }, notifyOnNetworkStatusChange: true });
  const feed = useConnection(query, (d) => d.userPosts);

  return (
    <YStack width="100%" maxWidth={640} alignSelf="center">
      <XStack role="tablist" borderBottomWidth={1} borderBottomColor="$borderColor">
        <Text
          role="tab"
          aria-selected
          paddingHorizontal="$4"
          paddingVertical="$3"
          fontWeight="700"
          color="$blue10"
          borderBottomWidth={2}
          borderBottomColor="$blue10"
        >
          {t('profile.tabs.posts')}
        </Text>
      </XStack>
      <YStack role="tabpanel">
        <PostList
          feed={feed}
          empty={
            <Paragraph textAlign="center" color="$color10" padding="$6">
              {t('feed.userEmpty')}
            </Paragraph>
          }
        />
      </YStack>
    </YStack>
  );
}

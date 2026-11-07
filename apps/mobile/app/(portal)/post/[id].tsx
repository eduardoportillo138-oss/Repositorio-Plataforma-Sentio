import { usePostDetailQuery } from '@sentio/api-client';
import { useTranslation } from '@sentio/i18n';
import { EmptyState, H4, PostCardSkeleton, SearchIcon, YStack } from '@sentio/ui';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommentsList } from '@/components/CommentsList';
import { PostItem } from '@/components/PostItem';
import { ScreenHeader } from '@/components/ScreenHeader';

/** Detalle de una publicación (enlace compartido, notificación o sentio://post/<id>). */
export default function PostDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading } = usePostDetailQuery({ variables: { id } });
  const post = data?.post;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScreenHeader title={t('post.detailTitle')} />
      {loading && !data ? (
        <PostCardSkeleton />
      ) : !post ? (
        <EmptyState icon={SearchIcon} title={t('post.notFound')} />
      ) : (
        <CommentsList
          postId={post.id}
          header={
            <YStack>
              <PostItem post={post} detail />
              <YStack paddingHorizontal="$4" paddingTop="$3">
                <H4>{t('comments.title')}</H4>
              </YStack>
            </YStack>
          }
        />
      )}
    </SafeAreaView>
  );
}

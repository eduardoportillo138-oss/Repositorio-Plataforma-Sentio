'use client';

import { usePostDetailQuery } from '@sentio/api-client';
import { useTranslation } from '@sentio/i18n';
import { EmptyState, H4, PostCardSkeleton, SearchIcon, YStack } from '@sentio/ui';
import { useParams } from 'next/navigation';
import { CommentsList } from '@/components/CommentsList';
import { PostItem } from '@/components/PostItem';

/** Detalle de una publicación (enlace compartido o notificación) con sus comentarios. */
export default function PostDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data, loading } = usePostDetailQuery({ variables: { id } });

  if (loading && !data) {
    return (
      <YStack width="100%" maxWidth={640} alignSelf="center">
        <PostCardSkeleton />
      </YStack>
    );
  }

  const post = data?.post;
  if (!post) return <EmptyState icon={SearchIcon} title={t('post.notFound')} />;

  return (
    <YStack width="100%" maxWidth={640} alignSelf="center">
      <PostItem post={post} detail />
      <YStack paddingHorizontal="$4" paddingTop="$4">
        <H4>{t('comments.title')}</H4>
      </YStack>
      <CommentsList postId={post.id} />
    </YStack>
  );
}

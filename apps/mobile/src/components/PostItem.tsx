import { type PostFieldsFragment, useDeletePost } from '@sentio/api-client';
import { useRelativeTime, useTranslation } from '@sentio/i18n';
import { Button, PostCard, TrashIcon } from '@sentio/ui';
import { useRouter } from 'expo-router';
import { memo } from 'react';
import { Alert } from 'react-native';
import { UserAvatar } from './UserAvatar';

/** PostCard con avatar nativo, enlace al autor y borrado (con confirmación) si es propia. */
export const PostItem = memo(function PostItem({ post }: { post: PostFieldsFragment }) {
  const { t } = useTranslation();
  const relative = useRelativeTime();
  const router = useRouter();
  const { remove, deleting } = useDeletePost();
  const { author } = post;

  const confirmDelete = () =>
    Alert.alert(t('post.delete'), t('post.deleteConfirm'), [
      { text: t('post.cancel'), style: 'cancel' },
      {
        text: t('post.deleteConfirmYes'),
        style: 'destructive',
        onPress: () => void remove(post.id),
      },
    ]);

  return (
    <PostCard
      authorName={author.displayName}
      authorHandle={author.handle}
      authorAvatar={<UserAvatar name={author.displayName} avatar={author.avatar} size={40} />}
      authorLabel={t('post.authorProfile', { name: author.displayName })}
      onAuthorPress={() => router.push(`/u/${author.handle}`)}
      timeLabel={relative(post.createdAt)}
      title={post.title}
      text={post.text}
      seeMoreLabel={t('post.seeMore')}
      seeLessLabel={t('post.seeLess')}
      menu={
        post.viewerIsAuthor ? (
          <Button
            tone="ghost"
            size="$3"
            minWidth={44}
            minHeight={44}
            icon={<TrashIcon size={18} />}
            aria-label={t('post.delete')}
            disabled={deleting}
            onPress={confirmDelete}
          />
        ) : null
      }
    />
  );
});

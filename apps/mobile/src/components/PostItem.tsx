import { type PostFieldsFragment, useDeletePost, useToggleLike } from '@sentio/api-client';
import { useRelativeTime, useTranslation } from '@sentio/i18n';
import { Button, PostActions, PostCard, TrashIcon } from '@sentio/ui';
import { useRouter } from 'expo-router';
import { memo } from 'react';
import { Alert } from 'react-native';
import { usePostInteractions } from './PostInteractions';
import { UserAvatar } from './UserAvatar';

export interface PostItemProps {
  post: PostFieldsFragment;
  /** En el detalle los comentarios ya están en pantalla y no se "abre" el post. */
  detail?: boolean;
}

/** PostCard con avatar nativo, acciones (Me gusta, comentar, compartir), enlace al autor y borrado. */
export const PostItem = memo(function PostItem({ post, detail = false }: PostItemProps) {
  const { t } = useTranslation();
  const relative = useRelativeTime();
  const router = useRouter();
  const { remove, deleting } = useDeletePost();
  const { toggle } = useToggleLike();
  const { openComments, openShare } = usePostInteractions();
  const { author } = post;
  const target = { id: post.id, title: post.title };

  const confirmDelete = () =>
    Alert.alert(t('post.delete'), t('post.deleteConfirm'), [
      { text: t('post.cancel'), style: 'cancel' },
      {
        text: t('post.deleteConfirmYes'),
        style: 'destructive',
        onPress: () =>
          void remove(post.id).then(() => {
            if (detail) router.back();
          }),
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
      onPress={detail ? undefined : () => router.push(`/post/${post.id}`)}
      actions={
        <PostActions
          liked={post.viewerHasLiked}
          likes={post.counts.reactions}
          comments={post.counts.comments}
          shares={post.counts.shares}
          labels={{
            like: t('post.like'),
            unlike: t('post.unlike'),
            comment: t('post.comment'),
            share: t('post.share'),
          }}
          onLike={() => void toggle(post)}
          onComment={() => (detail ? undefined : openComments(target))}
          onShare={() => openShare(target)}
        />
      }
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

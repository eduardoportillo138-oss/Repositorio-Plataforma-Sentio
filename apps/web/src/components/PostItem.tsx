'use client';

import { type PostFieldsFragment, useDeletePost, useToggleLike } from '@sentio/api-client';
import { useRelativeTime, useTranslation } from '@sentio/i18n';
import { Button, PostActions, PostCard, TrashIcon } from '@sentio/ui';
import { useParams, useRouter } from 'next/navigation';
import { usePostInteractions } from './PostInteractions';
import { UserAvatar } from './UserAvatar';

export interface PostItemProps {
  post: PostFieldsFragment;
  /** En el detalle no tiene sentido "abrir" el post ni abrir el panel de comentarios. */
  detail?: boolean;
}

/** PostCard con avatar de web, enlace al autor, acciones (Me gusta, comentar, compartir) y borrado. */
export function PostItem({ post, detail = false }: PostItemProps) {
  const { t } = useTranslation();
  const relative = useRelativeTime();
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const { remove, deleting } = useDeletePost();
  const { toggle } = useToggleLike();
  const { openComments, openShare } = usePostInteractions();
  const { author } = post;
  const target = { id: post.id, title: post.title };

  return (
    <PostCard
      authorName={author.displayName}
      authorHandle={author.handle}
      authorAvatar={<UserAvatar name={author.displayName} avatar={author.avatar} size={40} />}
      authorLabel={t('post.authorProfile', { name: author.displayName })}
      onAuthorPress={() => router.push(`/${locale}/u/${author.handle}`)}
      timeLabel={relative(post.createdAt)}
      title={post.title}
      text={post.text}
      seeMoreLabel={t('post.seeMore')}
      seeLessLabel={t('post.seeLess')}
      onPress={detail ? undefined : () => router.push(`/${locale}/post/${post.id}`)}
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
            minHeight={44}
            icon={<TrashIcon size={16} />}
            aria-label={t('post.delete')}
            disabled={deleting}
            onPress={() => {
              if (window.confirm(t('post.deleteConfirm'))) {
                void remove(post.id).then(() => {
                  if (detail) router.replace(`/${locale}`);
                });
              }
            }}
          />
        ) : null
      }
    />
  );
}

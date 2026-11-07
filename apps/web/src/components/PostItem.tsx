'use client';

import { type PostFieldsFragment, useDeletePost } from '@sentio/api-client';
import { useRelativeTime, useTranslation } from '@sentio/i18n';
import { Button, PostCard, TrashIcon } from '@sentio/ui';
import { useParams, useRouter } from 'next/navigation';
import { UserAvatar } from './UserAvatar';

/** PostCard con el avatar de web, enlace al autor y borrado si es propia. */
export function PostItem({ post }: { post: PostFieldsFragment }) {
  const { t } = useTranslation();
  const relative = useRelativeTime();
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const { remove, deleting } = useDeletePost();
  const { author } = post;

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
              if (window.confirm(t('post.deleteConfirm'))) void remove(post.id);
            }}
          />
        ) : null
      }
    />
  );
}

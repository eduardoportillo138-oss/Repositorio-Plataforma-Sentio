'use client';

import {
  COMMENT_MAX_LENGTH,
  type CommentFieldsFragment,
  useCommentForm,
  useConnection,
  useDeleteComment,
  usePostCommentsQuery,
} from '@sentio/api-client';
import { useDynamicT, useRelativeTime, useTranslation } from '@sentio/i18n';
import {
  CommentComposer,
  CommentItem,
  ErrorState,
  Paragraph,
  PostCardSkeleton,
  Spinner,
  YStack,
} from '@sentio/ui';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { UserAvatar } from './UserAvatar';

function Comment({ comment }: { comment: CommentFieldsFragment }) {
  const { t } = useTranslation();
  const relative = useRelativeTime();
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const { remove } = useDeleteComment();
  const { author } = comment;
  return (
    <CommentItem
      authorName={author.displayName}
      authorHandle={author.handle}
      authorAvatar={<UserAvatar name={author.displayName} avatar={author.avatar} size={32} />}
      onAuthorPress={() => router.push(`/${locale}/u/${author.handle}`)}
      timeLabel={relative(comment.createdAt)}
      text={comment.text}
      deleteLabel={t('comments.delete')}
      onDelete={
        comment.viewerCanDelete
          ? () => {
              if (window.confirm(t('comments.deleteConfirm'))) void remove(comment.id);
            }
          : undefined
      }
    />
  );
}

/**
 * Lista paginada de comentarios (del más antiguo al más reciente) con el campo para escribir.
 * Pide la siguiente página cuando el final de la lista entra en pantalla.
 */
export function CommentsList({ postId }: { postId: string }) {
  const { t } = useTranslation();
  const tr = useDynamicT();
  const query = usePostCommentsQuery({ variables: { postId }, notifyOnNetworkStatusChange: true });
  const feed = useConnection(query, (d) => d.postComments);
  const form = useCommentForm(postId);
  const sentinel = useRef<HTMLDivElement>(null);
  const { hasMore, loadMore } = feed;

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && hasMore) void loadMore();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <YStack flex={1}>
      <YStack flex={1}>
        {feed.initialLoading ? (
          <PostCardSkeleton />
        ) : feed.error && feed.items.length === 0 ? (
          <ErrorState
            message={t('comments.error')}
            retryLabel={t('feed.retry')}
            onRetry={() => void feed.refresh()}
          />
        ) : feed.items.length === 0 ? (
          <Paragraph textAlign="center" color="$color10" padding="$5">
            {t('comments.empty')}
          </Paragraph>
        ) : (
          feed.items.map((c) => <Comment key={c.id} comment={c} />)
        )}
        <div ref={sentinel} />
        {feed.loadingMore ? (
          <YStack alignItems="center" padding="$3">
            <Spinner />
          </YStack>
        ) : null}
      </YStack>
      <CommentComposer
        value={form.text}
        onChange={form.setText}
        onSubmit={() => void form.submit()}
        sending={form.sending}
        placeholder={t('comments.placeholder')}
        sendLabel={t('comments.send')}
        maxLength={COMMENT_MAX_LENGTH}
        error={tr(form.errors.fields.text ?? form.errors.form)}
      />
    </YStack>
  );
}

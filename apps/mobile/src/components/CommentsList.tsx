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
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { type ReactElement } from 'react';
import { Alert } from 'react-native';
import { UserAvatar } from './UserAvatar';

function Comment({
  comment,
  onNavigate,
}: {
  comment: CommentFieldsFragment;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const relative = useRelativeTime();
  const router = useRouter();
  const { remove } = useDeleteComment();
  const { author } = comment;
  return (
    <CommentItem
      authorName={author.displayName}
      authorHandle={author.handle}
      authorAvatar={<UserAvatar name={author.displayName} avatar={author.avatar} size={32} />}
      onAuthorPress={() => {
        onNavigate?.();
        router.push(`/u/${author.handle}`);
      }}
      timeLabel={relative(comment.createdAt)}
      text={comment.text}
      deleteLabel={t('comments.delete')}
      onDelete={
        comment.viewerCanDelete
          ? () =>
              Alert.alert(t('comments.delete'), t('comments.deleteConfirm'), [
                { text: t('post.cancel'), style: 'cancel' },
                {
                  text: t('post.deleteConfirmYes'),
                  style: 'destructive',
                  onPress: () => void remove(comment.id),
                },
              ])
          : undefined
      }
    />
  );
}

export interface CommentsListProps {
  postId: string;
  /** Encabezado que se desplaza con la lista (en el detalle, el propio post). */
  header?: ReactElement;
  /** Se llama antes de navegar a un perfil (p. ej. para cerrar la hoja). */
  onNavigate?: () => void;
}

/** Comentarios paginados (scroll infinito) con el campo para escribir fijo abajo. */
export function CommentsList({ postId, header, onNavigate }: CommentsListProps) {
  const { t } = useTranslation();
  const tr = useDynamicT();
  const query = usePostCommentsQuery({ variables: { postId }, notifyOnNetworkStatusChange: true });
  const feed = useConnection(query, (d) => d.postComments);
  const form = useCommentForm(postId);

  const empty = feed.initialLoading ? (
    <PostCardSkeleton />
  ) : feed.error ? (
    <ErrorState
      message={t('comments.error')}
      retryLabel={t('feed.retry')}
      onRetry={() => void feed.refresh()}
    />
  ) : (
    <Paragraph textAlign="center" color="$color10" padding="$5">
      {t('comments.empty')}
    </Paragraph>
  );

  return (
    <YStack flex={1}>
      <FlashList
        data={feed.items}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <Comment comment={item} onNavigate={onNavigate} />}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={
          feed.loadingMore ? (
            <YStack alignItems="center" padding="$3">
              <Spinner />
            </YStack>
          ) : null
        }
        onEndReached={() => {
          if (feed.hasMore && !feed.loadingMore) void feed.loadMore();
        }}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
      />
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

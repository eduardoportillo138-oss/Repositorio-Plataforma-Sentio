'use client';

import { type Reference } from '@apollo/client';
import {
  addCommentSchema,
  COMMENT_MAX_LENGTH,
  SEARCH_QUERY_MIN_LENGTH,
  SHARE_MAX_RECIPIENTS,
  sharePostSchema,
} from '@sentio/core';
import { useCallback, useEffect, useState } from 'react';
import { apiFormErrors, type FormErrors, NO_ERRORS, validationErrors } from './form-errors';
import {
  CommentFieldsFragmentDoc,
  type PostCountsFieldsFragment,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useSearchUsersQuery,
  useSharePostMutation,
  useToggleLikeMutation,
} from './generated/graphql';
import { useConnection } from './use-connection';

export { COMMENT_MAX_LENGTH, SHARE_MAX_RECIPIENTS };

/**
 * "Me gusta" con respuesta inmediata: la caché cambia antes de que responda la API (respuesta
 * optimista) y Apollo la revierte sola si la mutación falla.
 */
export function useToggleLike() {
  const [mutate] = useToggleLikeMutation();
  const [error, setError] = useState<string | null>(null);

  const toggle = useCallback(
    async (post: PostCountsFieldsFragment) => {
      setError(null);
      const liked = !post.viewerHasLiked;
      try {
        await mutate({
          variables: { postId: post.id },
          optimisticResponse: {
            toggleLike: {
              __typename: 'Post',
              id: post.id,
              viewerHasLiked: liked,
              counts: {
                ...post.counts,
                __typename: 'PostCounts',
                reactions: Math.max(0, post.counts.reactions + (liked ? 1 : -1)),
              },
            },
          },
        });
      } catch (e) {
        setError(apiFormErrors(e).form ?? 'errors.unknown');
      }
    },
    [mutate],
  );

  return { toggle, error };
}

interface ConnectionRef {
  edges: readonly { cursor: string; node: Reference }[];
  pageInfo?: { hasNextPage?: boolean };
}

/** Campo para comentar un post. Al enviar, el comentario se agrega al final si la lista ya está completa. */
export function useCommentForm(postId: string) {
  const [mutate, { loading: sending }] = useAddCommentMutation();
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<FormErrors>(NO_ERRORS);

  const submit = useCallback(async (): Promise<boolean> => {
    const parsed = addCommentSchema.safeParse({ postId, text });
    if (!parsed.success) {
      setErrors(validationErrors(parsed.error.issues));
      return false;
    }
    setErrors(NO_ERRORS);
    try {
      await mutate({
        variables: parsed.data,
        update: (cache, { data }) => {
          if (!data) return;
          const ref = cache.writeFragment({
            fragment: CommentFieldsFragmentDoc,
            fragmentName: 'CommentFields',
            data: data.addComment,
          });
          if (!ref) return;
          cache.modify({
            fields: {
              postComments: (value: unknown, { storeFieldName }) => {
                const existing = value as ConnectionRef | undefined;
                if (!existing?.edges || !storeFieldName.includes(`"postId":"${postId}"`)) {
                  return value;
                }
                // Si faltan páginas, el comentario aparecerá al llegar al final.
                if (existing.pageInfo?.hasNextPage) return value;
                return {
                  ...existing,
                  edges: [...existing.edges, { __typename: 'CommentEdge', cursor: '', node: ref }],
                };
              },
            },
          });
        },
      });
      setText('');
      return true;
    } catch (e) {
      setErrors(apiFormErrors(e));
      return false;
    }
  }, [postId, text, mutate]);

  return { text, setText, errors, sending, submit };
}

/** Borra un comentario y lo quita de la caché (el contador del post se actualiza con la respuesta). */
export function useDeleteComment() {
  const [mutate, { loading }] = useDeleteCommentMutation();
  const remove = useCallback(
    async (commentId: string) => {
      await mutate({
        variables: { commentId },
        update: (cache) => {
          cache.evict({ id: cache.identify({ __typename: 'Comment', id: commentId }) });
          cache.gc();
        },
      });
    },
    [mutate],
  );
  return { remove, deleting: loading };
}

/** Devuelve `value` cuando deja de cambiar durante `delayMs`. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export const SEARCH_DEBOUNCE_MS = 300;

/** Búsqueda de personas con debounce de 300 ms (no consulta con menos de 2 caracteres). */
export function useUserSearch(text: string, active = true) {
  const query = useDebouncedValue(text.trim(), SEARCH_DEBOUNCE_MS);
  const enabled = active && query.length >= SEARCH_QUERY_MIN_LENGTH;
  const result = useSearchUsersQuery({
    variables: { query },
    skip: !enabled,
    notifyOnNetworkStatusChange: true,
  });
  const connection = useConnection(result, (d) => d.searchUsers);
  return { ...connection, query, enabled, pending: text.trim() !== query };
}

/** Compartir con hasta 10 personas, con mensaje opcional. */
export function useSharePost(postId: string) {
  const [mutate, { loading: sending }] = useSharePostMutation();
  const [errors, setErrors] = useState<FormErrors>(NO_ERRORS);

  const share = useCallback(
    async (recipientIds: string[], message: string): Promise<number | null> => {
      const parsed = sharePostSchema.safeParse({ postId, recipientIds, message });
      if (!parsed.success) {
        setErrors(validationErrors(parsed.error.issues));
        return null;
      }
      setErrors(NO_ERRORS);
      try {
        const { data } = await mutate({
          variables: {
            postId: parsed.data.postId,
            recipientIds: parsed.data.recipientIds,
            message: parsed.data.message ?? null,
          },
        });
        return data?.sharePost.sentTo ?? 0;
      } catch (e) {
        setErrors(apiFormErrors(e));
        return null;
      }
    },
    [postId, mutate],
  );

  return { share, sending, errors };
}

/** Enlace público a una publicación (para compartir fuera de la app). */
export function postShareUrl(baseUrl: string, locale: string, postId: string): string {
  return `${baseUrl.replace(/\/$/, '')}/${locale}/post/${postId}`;
}

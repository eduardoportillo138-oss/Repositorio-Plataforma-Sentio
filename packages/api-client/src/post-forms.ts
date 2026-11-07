'use client';

import { type ApolloCache, type Reference } from '@apollo/client';
import {
  createPostSchema,
  POST_TEXT_MAX_LENGTH,
  POST_TITLE_MAX_LENGTH,
  type PostVisibility,
} from '@sentio/core';
import { useCallback, useState } from 'react';
import { useAuth } from './auth-provider';
import { apiFormErrors, type FormErrors, NO_ERRORS, validationErrors } from './form-errors';
import {
  type PostFieldsFragment,
  PostFieldsFragmentDoc,
  useCreatePostMutation,
  useDeletePostMutation,
} from './generated/graphql';

export { POST_TEXT_MAX_LENGTH, POST_TITLE_MAX_LENGTH };

interface ConnectionRef {
  edges: readonly { __typename?: string; cursor: string; node: Reference }[];
  pageInfo: unknown;
}

/**
 * Agrega una publicación recién creada al principio de Inicio (si es pública) y de las
 * publicaciones del autor, sin volver a pedir las listas.
 */
export function prependPost(cache: ApolloCache<unknown>, post: PostFieldsFragment, handle: string) {
  const ref = cache.writeFragment({
    fragment: PostFieldsFragmentDoc,
    fragmentName: 'PostFields',
    data: post,
  });
  if (!ref) return;
  // Los modificadores reciben el valor crudo de la caché (Relay: { edges, pageInfo }).
  const prepend = (value: unknown): unknown => {
    const existing = value as ConnectionRef | undefined;
    if (!existing?.edges) return value;
    return {
      ...existing,
      edges: [{ __typename: 'PostEdge', cursor: '', node: ref }, ...existing.edges],
    };
  };

  cache.modify({
    fields: {
      homeFeed: (value: unknown) => (post.visibility === 'public' ? prepend(value) : value),
      userPosts: (value: unknown, { storeFieldName }) =>
        storeFieldName.includes(`"handle":"${handle}"`) ? prepend(value) : value,
    },
  });
}

/** Formulario "Nueva publicación" (título, descripción y visibilidad), igual en web y móvil. */
export function useCreatePostForm(onCreated?: (post: PostFieldsFragment) => void) {
  const { viewer } = useAuth();
  const [mutate, { loading: saving }] = useCreatePostMutation();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [errors, setErrors] = useState<FormErrors>(NO_ERRORS);

  const reset = useCallback(() => {
    setTitle('');
    setText('');
    setVisibility('public');
    setErrors(NO_ERRORS);
  }, []);

  const submit = useCallback(async (): Promise<boolean> => {
    const parsed = createPostSchema.safeParse({ title, text, visibility });
    if (!parsed.success) {
      setErrors(validationErrors(parsed.error.issues));
      return false;
    }
    setErrors(NO_ERRORS);
    try {
      const { data } = await mutate({
        variables: { input: parsed.data },
        update: (cache, { data: d }) => {
          if (d && viewer) prependPost(cache, d.createPost, viewer.handle);
        },
      });
      if (data) onCreated?.(data.createPost);
      reset();
      return true;
    } catch (error) {
      setErrors(apiFormErrors(error));
      return false;
    }
  }, [title, text, visibility, mutate, viewer, onCreated, reset]);

  return {
    title,
    setTitle,
    text,
    setText,
    visibility,
    setVisibility,
    errors,
    saving,
    submit,
    reset,
  };
}

/** Borra una publicación propia y la saca de todas las listas en caché. */
export function useDeletePost() {
  const [mutate, { loading }] = useDeletePostMutation();
  const remove = useCallback(
    async (postId: string) => {
      await mutate({
        variables: { postId },
        update: (cache) => {
          cache.evict({ id: cache.identify({ __typename: 'Post', id: postId }) });
          cache.gc();
        },
      });
    },
    [mutate],
  );
  return { remove, deleting: loading };
}

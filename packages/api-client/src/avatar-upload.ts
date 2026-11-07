'use client';

import { gql, useApolloClient } from '@apollo/client';
import { AVATAR_MAX_BYTES, AVATAR_MIME_TYPES } from '@sentio/core';
import { useCallback, useRef, useState } from 'react';
import { useAuth } from './auth-provider';
import {
  type AvatarFieldsFragment,
  useConfirmAvatarUploadMutation,
  useRemoveAvatarMutation,
  useRequestAvatarUploadMutation,
} from './generated/graphql';
import { useRealtimeEvent } from './realtime-provider';

/** Archivo listo para subir. En web es un File/Blob; en móvil, el Blob de `fetch(uri)`. */
export interface AvatarFile {
  body: Blob;
  mimeType: string;
  sizeBytes: number;
}

export type AvatarUploadStatus = 'idle' | 'uploading' | 'processing' | 'ready' | 'failed';

/** Clave de i18n del error, si lo hubo. */
export type AvatarUploadError =
  | 'validation.avatar.type'
  | 'validation.avatar.size'
  | 'profile.avatar.failed'
  | 'errors.network'
  | 'errors.unknown';

/** Sube el archivo con un PUT directo a la URL prefirmada (sin pasar por la API). */
export async function uploadToPresignedUrl(
  url: string,
  headers: readonly { name: string; value: string }[],
  body: Blob,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const res = await fetchImpl(url, {
    method: 'PUT',
    headers: Object.fromEntries(headers.map((h) => [h.name, h.value])),
    body,
  });
  if (!res.ok) throw new Error(`La subida falló con HTTP ${res.status}`);
}

const AVATAR_ON_USER = gql`
  fragment AvatarOnUser on User {
    avatar {
      assetId
      url256
      url512
      blurhash
    }
  }
`;

/** Si el socket no está conectado, revisa el estado del asset cada 2 s durante 60 s. */
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60_000;

/**
 * Flujo completo de la foto de perfil, igual en web y móvil:
 * requestAvatarUpload → PUT al almacenamiento → confirmAvatarUpload → espera `media:ready`.
 */
export function useAvatarUpload() {
  const client = useApolloClient();
  const { viewer } = useAuth();
  const [requestUpload] = useRequestAvatarUploadMutation();
  const [confirmUpload] = useConfirmAvatarUploadMutation();
  const [removeAvatarMutation, removeState] = useRemoveAvatarMutation();
  const [status, setStatus] = useState<AvatarUploadStatus>('idle');
  const [error, setError] = useState<AvatarUploadError | null>(null);
  const pendingAsset = useRef<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = null;
  };

  const applyAvatar = useCallback(
    (avatar: AvatarFieldsFragment) => {
      if (!viewer) return;
      client.writeFragment({
        id: client.cache.identify({ __typename: 'User', id: viewer.id }),
        fragment: AVATAR_ON_USER,
        data: { __typename: 'User', avatar: { __typename: 'Avatar', ...avatar } },
      });
    },
    [client, viewer],
  );

  const finish = useCallback(
    (result: { ok: true; avatar: AvatarFieldsFragment } | { ok: false }) => {
      pendingAsset.current = null;
      stopPolling();
      if (result.ok) {
        applyAvatar(result.avatar);
        setStatus('ready');
      } else {
        setError('profile.avatar.failed');
        setStatus('failed');
      }
    },
    [applyAvatar],
  );

  useRealtimeEvent('media:ready', (event) => {
    if (event.assetId === pendingAsset.current) finish({ ok: true, avatar: event.avatar });
  });
  useRealtimeEvent('media:failed', (event) => {
    if (event.assetId === pendingAsset.current) finish({ ok: false });
  });

  const upload = useCallback(
    async (file: AvatarFile): Promise<void> => {
      setError(null);
      if (!(AVATAR_MIME_TYPES as readonly string[]).includes(file.mimeType)) {
        setError('validation.avatar.type');
        setStatus('failed');
        return;
      }
      if (file.sizeBytes > AVATAR_MAX_BYTES) {
        setError('validation.avatar.size');
        setStatus('failed');
        return;
      }

      try {
        setStatus('uploading');
        const { data: ticketData } = await requestUpload({
          variables: { mimeType: file.mimeType, sizeBytes: file.sizeBytes },
        });
        const ticket = ticketData!.requestAvatarUpload;
        await uploadToPresignedUrl(ticket.uploadUrl, ticket.headers, file.body);

        setStatus('processing');
        pendingAsset.current = ticket.assetId;
        const { data } = await confirmUpload({ variables: { assetId: ticket.assetId } });
        const asset = data!.confirmAvatarUpload;
        if (asset.status === 'ready' && asset.avatar)
          return finish({ ok: true, avatar: asset.avatar });
        if (asset.status === 'failed') return finish({ ok: false });

        // Con colas: el resultado llega por Socket.IO; como respaldo, consulta el asset.
        const started = Date.now();
        stopPolling();
        pollTimer.current = setInterval(() => {
          if (Date.now() - started > POLL_TIMEOUT_MS) return finish({ ok: false });
          void confirmUpload({ variables: { assetId: ticket.assetId } }).then(({ data: d }) => {
            const a = d?.confirmAvatarUpload;
            if (!a || pendingAsset.current !== ticket.assetId) return;
            if (a.status === 'ready' && a.avatar) finish({ ok: true, avatar: a.avatar });
            else if (a.status === 'failed') finish({ ok: false });
          });
        }, POLL_INTERVAL_MS);
      } catch (e) {
        pendingAsset.current = null;
        stopPolling();
        const message = e instanceof Error ? e.message : '';
        setError(/fetch|network|HTTP/i.test(message) ? 'errors.network' : 'errors.unknown');
        setStatus('failed');
      }
    },
    [requestUpload, confirmUpload, finish],
  );

  const remove = useCallback(async () => {
    setError(null);
    await removeAvatarMutation();
    setStatus('idle');
  }, [removeAvatarMutation]);

  return {
    upload,
    remove,
    status,
    error,
    busy: status === 'uploading' || status === 'processing' || removeState.loading,
  };
}

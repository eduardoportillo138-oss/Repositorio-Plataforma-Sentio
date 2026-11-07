'use client';

import { type AvatarFieldsFragment, useAvatarUpload } from '@sentio/api-client';
import { AVATAR_MIME_TYPES } from '@sentio/core';
import { useDynamicT, useTranslation } from '@sentio/i18n';
import {
  Button,
  CameraIcon,
  FormMessage,
  Notice,
  Paragraph,
  TrashIcon,
  XStack,
  YStack,
} from '@sentio/ui';
import { useEffect, useRef, useState } from 'react';
import { UserAvatar } from './UserAvatar';

export interface AvatarPickerProps {
  name: string;
  avatar: AvatarFieldsFragment | null | undefined;
}

/** Cambiar o quitar la foto de perfil: input de archivo con vista previa y subida directa. */
export function AvatarPicker({ name, avatar }: AvatarPickerProps) {
  const { t } = useTranslation();
  const tr = useDynamicT();
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, remove, status, error, busy } = useAvatarUpload();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);

  // Libera la URL local al cambiarla o al desmontar.
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  // Al terminar (bien o mal) se deja de mostrar la vista previa local.
  useEffect(() => {
    if (status === 'ready' || status === 'failed') setPreviewUrl(null);
  }, [status]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setRemoved(false);
    setPreviewUrl(URL.createObjectURL(file));
    await upload({ body: file, mimeType: file.type, sizeBytes: file.size });
    if (inputRef.current) inputRef.current.value = '';
  }

  const statusText =
    status === 'uploading'
      ? t('profile.avatar.uploading')
      : status === 'processing'
        ? t('profile.avatar.processing')
        : null;

  return (
    <YStack alignItems="center" gap="$3">
      <UserAvatar name={name} avatar={avatar} size={128} previewUrl={previewUrl} />
      <input
        ref={inputRef}
        type="file"
        accept={AVATAR_MIME_TYPES.join(',')}
        hidden
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      <XStack gap="$2" flexWrap="wrap" justifyContent="center">
        <Button
          tone="ghost"
          icon={<CameraIcon size={18} />}
          disabled={busy}
          onPress={() => inputRef.current?.click()}
        >
          {avatar ? t('profile.avatar.change') : t('profile.avatar.choose')}
        </Button>
        {avatar ? (
          <Button
            tone="ghost"
            icon={<TrashIcon size={18} />}
            disabled={busy}
            onPress={() => {
              void remove().then(() => setRemoved(true));
            }}
          >
            {t('profile.avatar.remove')}
          </Button>
        ) : null}
      </XStack>
      {statusText ? (
        <Paragraph color="$color10" aria-live="polite">
          {statusText}
        </Paragraph>
      ) : null}
      {status === 'ready' ? <Notice tone="success">{t('profile.avatar.ready')}</Notice> : null}
      {removed ? <Notice tone="success">{t('profile.avatar.removed')}</Notice> : null}
      <FormMessage>{tr(error)}</FormMessage>
    </YStack>
  );
}

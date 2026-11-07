import { type AvatarFieldsFragment, useAvatarUpload } from '@sentio/api-client';
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
import { useEffect, useState } from 'react';
import { pickAvatar } from '@/avatar-picker';
import { UserAvatar } from './UserAvatar';

export interface AvatarPickerProps {
  name: string;
  avatar: AvatarFieldsFragment | null | undefined;
}

/** Cambiar o quitar la foto de perfil desde la galería (recorte cuadrado y compresión local). */
export function AvatarPicker({ name, avatar }: AvatarPickerProps) {
  const { t } = useTranslation();
  const tr = useDynamicT();
  const { upload, remove, status, error, busy } = useAvatarUpload();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    if (status === 'ready' || status === 'failed') setPreviewUri(null);
  }, [status]);

  async function onPick() {
    setDenied(false);
    setRemoved(false);
    const result = await pickAvatar();
    if (result.kind === 'denied') return setDenied(true);
    if (result.kind === 'cancelled') return;
    setPreviewUri(result.previewUri);
    await upload(result.file);
  }

  const statusText =
    status === 'uploading'
      ? t('profile.avatar.uploading')
      : status === 'processing'
        ? t('profile.avatar.processing')
        : null;

  return (
    <YStack alignItems="center" gap="$3">
      <UserAvatar name={name} avatar={avatar} size={128} previewUri={previewUri} />
      <XStack gap="$2" flexWrap="wrap" justifyContent="center">
        <Button
          tone="ghost"
          icon={<CameraIcon size={18} />}
          disabled={busy}
          onPress={() => void onPick()}
        >
          {avatar ? t('profile.avatar.change') : t('profile.avatar.choose')}
        </Button>
        {avatar ? (
          <Button
            tone="ghost"
            icon={<TrashIcon size={18} />}
            disabled={busy}
            onPress={() => void remove().then(() => setRemoved(true))}
          >
            {t('profile.avatar.remove')}
          </Button>
        ) : null}
      </XStack>
      {statusText ? <Paragraph color="$color10">{statusText}</Paragraph> : null}
      {status === 'ready' ? <Notice tone="success">{t('profile.avatar.ready')}</Notice> : null}
      {removed ? <Notice tone="success">{t('profile.avatar.removed')}</Notice> : null}
      <FormMessage>{denied ? t('profile.avatar.permissionDenied') : tr(error)}</FormMessage>
    </YStack>
  );
}

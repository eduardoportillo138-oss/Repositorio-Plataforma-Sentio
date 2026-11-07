'use client';

import { type AvatarFieldsFragment } from '@sentio/api-client';
import { useTranslation } from '@sentio/i18n';
import { Avatar } from '@sentio/ui';
import { BlurhashImage } from './BlurhashImage';

export interface UserAvatarProps {
  name: string;
  avatar: AvatarFieldsFragment | null | undefined;
  size?: number;
  /** URL local (object URL) para la vista previa antes de subir. */
  previewUrl?: string | null;
}

/** Avatar de un usuario: foto con blurhash, vista previa local o iniciales. */
export function UserAvatar({ name, avatar, size = 96, previewUrl }: UserAvatarProps) {
  const { t } = useTranslation();
  const alt = t('profile.avatar.alt', { name });

  let image = null;
  if (previewUrl) {
    image = (
      // eslint-disable-next-line @next/next/no-img-element -- object URL local
      <img
        src={previewUrl}
        alt={t('profile.avatar.preview')}
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: 'cover' }}
      />
    );
  } else if (avatar) {
    image = (
      <BlurhashImage
        src={size > 256 ? avatar.url512 : avatar.url256}
        srcSet={`${avatar.url256} 256w, ${avatar.url512} 512w`}
        blurhash={avatar.blurhash}
        alt={alt}
        size={size}
      />
    );
  }

  return <Avatar name={name} size={size} image={image} label={alt} />;
}

import { type AvatarFieldsFragment } from '@sentio/api-client';
import { useTranslation } from '@sentio/i18n';
import { Avatar } from '@sentio/ui';
import { Image } from 'expo-image';

export interface UserAvatarProps {
  name: string;
  avatar: AvatarFieldsFragment | null | undefined;
  size?: number;
  /** URI local para la vista previa antes de subir. */
  previewUri?: string | null;
}

/** Avatar con expo-image: blurhash nativo como marcador mientras carga la foto. */
export function UserAvatar({ name, avatar, size = 96, previewUri }: UserAvatarProps) {
  const { t } = useTranslation();
  const alt = t('profile.avatar.alt', { name });
  const style = { width: size, height: size };

  const image = previewUri ? (
    <Image source={{ uri: previewUri }} style={style} contentFit="cover" accessibilityLabel={alt} />
  ) : avatar ? (
    <Image
      source={{ uri: size > 128 ? avatar.url512 : avatar.url256 }}
      placeholder={{ blurhash: avatar.blurhash }}
      transition={200}
      style={style}
      contentFit="cover"
      accessibilityLabel={alt}
    />
  ) : undefined;

  return <Avatar name={name} size={size} image={image} label={alt} />;
}

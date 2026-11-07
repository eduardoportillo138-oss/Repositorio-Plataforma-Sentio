'use client';

import { type ReactNode } from 'react';
import { H3, Paragraph, XStack, YStack } from 'tamagui';
import { Chip } from './Chip';

export interface ProfileHeaderProps {
  avatar: ReactNode;
  displayName: string;
  handle: string;
  bio: string | null;
  /** Etiquetas ya traducidas. */
  tags: readonly string[];
  emptyBio: string;
  emptyTags?: string;
  /** Botones (Editar perfil, Información privada…). */
  actions?: ReactNode;
}

/** Encabezado de perfil compartido por web y móvil. */
export function ProfileHeader({
  avatar,
  displayName,
  handle,
  bio,
  tags,
  emptyBio,
  emptyTags,
  actions,
}: ProfileHeaderProps) {
  return (
    <YStack alignItems="center" gap="$3" paddingVertical="$5" paddingHorizontal="$4">
      {avatar}
      <YStack alignItems="center" gap="$1">
        <H3 color="$color12" textAlign="center">
          {displayName}
        </H3>
        <Paragraph color="$color10">@{handle}</Paragraph>
      </YStack>
      <Paragraph
        color={bio ? '$color12' : '$color9'}
        textAlign="center"
        maxWidth={520}
        fontStyle={bio ? 'normal' : 'italic'}
      >
        {bio || emptyBio}
      </Paragraph>
      {tags.length > 0 ? (
        <XStack flexWrap="wrap" gap="$2" justifyContent="center">
          {tags.map((tag) => (
            <Chip key={tag} label={tag} selected />
          ))}
        </XStack>
      ) : emptyTags ? (
        <Paragraph size="$2" color="$color9">
          {emptyTags}
        </Paragraph>
      ) : null}
      {actions ? (
        <XStack gap="$2" flexWrap="wrap" justifyContent="center">
          {actions}
        </XStack>
      ) : null}
    </YStack>
  );
}

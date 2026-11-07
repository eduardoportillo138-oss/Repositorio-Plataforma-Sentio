'use client';

import { type ReactNode } from 'react';
import { Text, YStack } from 'tamagui';

export interface AvatarProps {
  /** Nombre para las iniciales de respaldo. */
  name: string;
  size?: number;
  /**
   * Imagen de la plataforma (expo-image en móvil, <img> con blurhash en web).
   * Se recorta en círculo. Si falta, se muestran las iniciales.
   */
  image?: ReactNode;
  label?: string;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0]![0], parts[parts.length - 1]![0]] : [parts[0]?.[0]];
  return letters.filter(Boolean).join('').toUpperCase() || '?';
}

/** Foto de perfil circular con iniciales como respaldo. */
export function Avatar({ name, size = 96, image, label }: AvatarProps) {
  return (
    <YStack
      width={size}
      height={size}
      borderRadius={size / 2}
      overflow="hidden"
      backgroundColor="$color5"
      alignItems="center"
      justifyContent="center"
      role="img"
      aria-label={label ?? name}
    >
      {image ?? (
        <Text fontSize={Math.round(size * 0.38)} fontWeight="700" color="$color11" aria-hidden>
          {initialsOf(name)}
        </Text>
      )}
    </YStack>
  );
}

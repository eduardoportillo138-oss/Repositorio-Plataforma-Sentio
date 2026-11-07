'use client';

import { Check } from '@tamagui/lucide-icons';
import { type ReactNode } from 'react';
import { Text, XStack, YStack } from 'tamagui';
import { Chip } from './Chip';

export interface UserRowProps {
  avatar: ReactNode;
  displayName: string;
  handle: string;
  /** Etiquetas ya traducidas (resultados de búsqueda). */
  tags?: readonly string[];
  onPress?: () => void;
  /** Con valor, la fila funciona como casilla (selector de personas). */
  selected?: boolean;
  disabled?: boolean;
}

/** Fila de persona: avatar, nombre, @handle y, opcionalmente, etiquetas o casilla. */
export function UserRow({
  avatar,
  displayName,
  handle,
  tags,
  onPress,
  selected,
  disabled = false,
}: UserRowProps) {
  const checkable = selected !== undefined;
  return (
    <XStack
      minHeight={56}
      paddingHorizontal="$4"
      paddingVertical="$2"
      gap="$3"
      alignItems="center"
      cursor={onPress && !disabled ? 'pointer' : undefined}
      hoverStyle={onPress ? { backgroundColor: '$color2' } : undefined}
      pressStyle={onPress ? { backgroundColor: '$color3' } : undefined}
      opacity={disabled ? 0.45 : 1}
      onPress={disabled ? undefined : onPress}
      role={checkable ? 'checkbox' : onPress ? 'button' : undefined}
      aria-checked={checkable ? selected : undefined}
      aria-disabled={disabled || undefined}
    >
      {avatar}
      <YStack flex={1} gap="$1">
        <Text fontWeight="700" color="$color12" numberOfLines={1}>
          {displayName}
        </Text>
        <Text fontSize="$2" color="$color10" numberOfLines={1}>
          @{handle}
        </Text>
        {tags && tags.length > 0 ? (
          <XStack gap="$1" flexWrap="wrap">
            {tags.map((t) => (
              <Chip key={t} label={t} />
            ))}
          </XStack>
        ) : null}
      </YStack>
      {checkable ? (
        <YStack
          width={24}
          height={24}
          borderRadius={12}
          borderWidth={2}
          borderColor={selected ? '$blue10' : '$color8'}
          backgroundColor={selected ? '$blue10' : 'transparent'}
          alignItems="center"
          justifyContent="center"
        >
          {selected ? <Check size={14} color="white" /> : null}
        </YStack>
      ) : null}
    </XStack>
  );
}

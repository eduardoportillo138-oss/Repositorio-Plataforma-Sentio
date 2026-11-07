'use client';

import { Text, XStack } from 'tamagui';

export interface ChipProps {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  /** Sin `onPress` es solo visual (etiqueta). */
  onPress?: () => void;
}

/** Etiqueta redondeada; con `onPress` funciona como botón de alternar (aria-pressed). */
export function Chip({ label, selected = false, disabled = false, onPress }: ChipProps) {
  const interactive = Boolean(onPress);
  return (
    <XStack
      minHeight={interactive ? 44 : 28}
      paddingHorizontal="$3"
      alignItems="center"
      borderRadius="$10"
      borderWidth={1}
      borderColor={selected ? '$blue8' : '$borderColor'}
      backgroundColor={selected ? '$blue3' : '$background'}
      opacity={disabled ? 0.45 : 1}
      cursor={interactive && !disabled ? 'pointer' : undefined}
      pressStyle={interactive && !disabled ? { opacity: 0.7 } : undefined}
      onPress={disabled ? undefined : onPress}
      role={interactive ? 'button' : undefined}
      aria-pressed={interactive ? selected : undefined}
      aria-disabled={interactive ? disabled : undefined}
    >
      <Text
        fontSize="$3"
        color={selected ? '$blue11' : '$color11'}
        fontWeight={selected ? '600' : '400'}
      >
        {label}
      </Text>
    </XStack>
  );
}

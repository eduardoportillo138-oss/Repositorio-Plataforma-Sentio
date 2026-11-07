'use client';

import { type ReactNode } from 'react';
import { YStack } from 'tamagui';

export interface FloatingActionButtonProps {
  icon: ReactNode;
  /** Etiqueta accesible (el botón solo muestra el ícono). */
  label: string;
  onPress: () => void;
  /** Distancia al borde inferior del contenedor (p. ej. para salvar la safe area). */
  bottom?: number;
  right?: number;
}

/** Botón flotante circular de 56 px en la esquina inferior derecha. */
export function FloatingActionButton({
  icon,
  label,
  onPress,
  bottom = 24,
  right = 20,
}: FloatingActionButtonProps) {
  return (
    <YStack
      position="absolute"
      bottom={bottom}
      right={right}
      width={56}
      height={56}
      borderRadius={28}
      alignItems="center"
      justifyContent="center"
      backgroundColor="$blue10"
      cursor="pointer"
      role="button"
      aria-label={label}
      onPress={onPress}
      pressStyle={{ scale: 0.95, backgroundColor: '$blue11' }}
      hoverStyle={{ backgroundColor: '$blue11' }}
      shadowColor="$shadowColor"
      shadowRadius={8}
      shadowOffset={{ width: 0, height: 4 }}
      shadowOpacity={0.25}
      elevation={6}
      zIndex={20}
    >
      {icon}
    </YStack>
  );
}

'use client';

import { Paragraph, YStack } from 'tamagui';

/** Mensaje de error general de un formulario (p. ej. credenciales inválidas). */
export function FormMessage({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <YStack
      backgroundColor="$red2"
      borderColor="$red6"
      borderWidth={1}
      borderRadius="$3"
      padding="$3"
    >
      <Paragraph color="$red11" role="alert">
        {children}
      </Paragraph>
    </YStack>
  );
}

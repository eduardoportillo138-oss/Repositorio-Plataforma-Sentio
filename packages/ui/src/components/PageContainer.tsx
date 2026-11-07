'use client';

import { type ReactNode } from 'react';
import { H2, ScrollView, YStack } from 'tamagui';

export interface PageContainerProps {
  title?: string;
  children: ReactNode;
  maxWidth?: number;
}

/** Contenedor desplazable con ancho máximo para pantallas de formulario o detalle. */
export function PageContainer({ title, children, maxWidth = 640 }: PageContainerProps) {
  return (
    <ScrollView
      flex={1}
      backgroundColor="$background"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <YStack width="100%" maxWidth={maxWidth} alignSelf="center" padding="$4" gap="$4">
        {title ? <H2 color="$color12">{title}</H2> : null}
        {children}
      </YStack>
    </ScrollView>
  );
}

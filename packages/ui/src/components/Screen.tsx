'use client';

import { type ReactNode } from 'react';
import { H2, Paragraph, ScrollView, YStack } from 'tamagui';

export interface AuthScreenProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Contenedor centrado para pantallas de autenticación (web y móvil). */
export function AuthScreen({ title, subtitle, children, footer }: AuthScreenProps) {
  return (
    <ScrollView
      flex={1}
      backgroundColor="$background"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
        <YStack width="100%" maxWidth={420} gap="$4">
          <YStack gap="$2">
            <H2 color="$color12">{title}</H2>
            {subtitle ? <Paragraph color="$color10">{subtitle}</Paragraph> : null}
          </YStack>
          <YStack gap="$3">{children}</YStack>
          {footer ? <YStack alignItems="center">{footer}</YStack> : null}
        </YStack>
      </YStack>
    </ScrollView>
  );
}

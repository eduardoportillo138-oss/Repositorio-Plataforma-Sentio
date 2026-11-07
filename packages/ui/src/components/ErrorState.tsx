'use client';

import { Paragraph, YStack } from 'tamagui';
import { Button } from './Button';

export interface ErrorStateProps {
  message: string;
  retryLabel: string;
  onRetry: () => void;
  retrying?: boolean;
}

/** Error de carga con botón de reintentar. */
export function ErrorState({ message, retryLabel, onRetry, retrying }: ErrorStateProps) {
  return (
    <YStack alignItems="center" justifyContent="center" padding="$6" gap="$3" role="alert">
      <Paragraph color="$color11" textAlign="center">
        {message}
      </Paragraph>
      <Button tone="ghost" loading={retrying} onPress={onRetry}>
        {retryLabel}
      </Button>
    </YStack>
  );
}

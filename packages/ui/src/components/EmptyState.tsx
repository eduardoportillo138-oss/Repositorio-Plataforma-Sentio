'use client';

import { type ReactNode } from 'react';
import { H3, Paragraph, YStack } from 'tamagui';
import { type NavIcon } from './NavItem';

export interface EmptyStateProps {
  icon?: NavIcon;
  title: string;
  body?: string;
  action?: ReactNode;
}

/** Estado vacío centrado para secciones sin contenido. */
export function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps) {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding="$6" gap="$3">
      {Icon ? <Icon size={40} color="$color8" /> : null}
      <H3 textAlign="center" color="$color12">
        {title}
      </H3>
      {body ? (
        <Paragraph textAlign="center" color="$color10" maxWidth={420}>
          {body}
        </Paragraph>
      ) : null}
      {action}
    </YStack>
  );
}

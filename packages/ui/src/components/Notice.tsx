'use client';

import { Lock } from '@tamagui/lucide-icons';
import { type ColorTokens, Paragraph, XStack } from 'tamagui';

export interface NoticeProps {
  children: string;
  tone?: 'private' | 'success' | 'info';
}

/** Aviso destacado. `private` lleva candado (p. ej. "Solo tú puedes ver esta información"). */
export function Notice({ children, tone = 'info' }: NoticeProps) {
  const palettes: Record<
    NonNullable<NoticeProps['tone']>,
    { bg: ColorTokens; border: ColorTokens; color: ColorTokens }
  > = {
    private: { bg: '$yellow2', border: '$yellow7', color: '$yellow11' },
    success: { bg: '$green2', border: '$green7', color: '$green11' },
    info: { bg: '$blue2', border: '$blue7', color: '$blue11' },
  };
  const palette = palettes[tone];
  return (
    <XStack
      gap="$2"
      alignItems="center"
      backgroundColor={palette.bg}
      borderColor={palette.border}
      borderWidth={1}
      borderRadius="$3"
      padding="$3"
      role={tone === 'success' ? 'status' : 'note'}
    >
      {tone === 'private' ? <Lock size={18} color={palette.color} /> : null}
      <Paragraph color={palette.color} flex={1} fontWeight="600">
        {children}
      </Paragraph>
    </XStack>
  );
}

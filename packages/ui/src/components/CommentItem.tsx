'use client';

import { Trash2 } from '@tamagui/lucide-icons';
import { type ReactNode } from 'react';
import { Paragraph, Text, XStack, YStack } from 'tamagui';

export interface CommentItemProps {
  authorName: string;
  authorHandle: string;
  authorAvatar: ReactNode;
  onAuthorPress?: () => void;
  timeLabel: string;
  text: string;
  /** Si se pasa, aparece el botón de borrar. */
  onDelete?: () => void;
  deleteLabel: string;
}

/** Un comentario de primer nivel. */
export function CommentItem({
  authorName,
  authorHandle,
  authorAvatar,
  onAuthorPress,
  timeLabel,
  text,
  onDelete,
  deleteLabel,
}: CommentItemProps) {
  return (
    <XStack gap="$3" paddingVertical="$3" paddingHorizontal="$4" alignItems="flex-start">
      <YStack onPress={onAuthorPress} cursor={onAuthorPress ? 'pointer' : undefined}>
        {authorAvatar}
      </YStack>
      <YStack flex={1} gap="$1">
        <XStack gap="$2" alignItems="baseline" flexWrap="wrap">
          <Text
            fontWeight="700"
            color="$color12"
            onPress={onAuthorPress}
            cursor={onAuthorPress ? 'pointer' : undefined}
          >
            {authorName}
          </Text>
          <Text fontSize="$2" color="$color10">
            @{authorHandle} · {timeLabel}
          </Text>
        </XStack>
        <Paragraph color="$color12">{text}</Paragraph>
      </YStack>
      {onDelete ? (
        <YStack
          width={44}
          height={44}
          alignItems="center"
          justifyContent="center"
          borderRadius="$10"
          cursor="pointer"
          hoverStyle={{ backgroundColor: '$color3' }}
          pressStyle={{ opacity: 0.6 }}
          role="button"
          aria-label={deleteLabel}
          onPress={onDelete}
        >
          <Trash2 size={16} color="$color10" />
        </YStack>
      ) : null}
    </XStack>
  );
}

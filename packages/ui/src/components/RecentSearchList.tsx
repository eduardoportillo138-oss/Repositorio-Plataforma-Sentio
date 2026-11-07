'use client';

import { History } from '@tamagui/lucide-icons';
import { Paragraph, Text, XStack, YStack } from 'tamagui';
import { Button } from './Button';

export interface RecentSearchListProps {
  items: readonly { id: string; query: string }[];
  title: string;
  emptyLabel: string;
  clearLabel: string;
  onSelect: (query: string) => void;
  onClear: () => void;
  clearing?: boolean;
}

/** Búsquedas recientes (se muestran con el campo vacío). */
export function RecentSearchList({
  items,
  title,
  emptyLabel,
  clearLabel,
  onSelect,
  onClear,
  clearing,
}: RecentSearchListProps) {
  return (
    <YStack gap="$1">
      <XStack
        alignItems="center"
        justifyContent="space-between"
        paddingHorizontal="$4"
        minHeight={44}
      >
        <Text fontWeight="700" color="$color11">
          {title}
        </Text>
        {items.length > 0 ? (
          <Button tone="ghost" size="$3" loading={clearing} onPress={onClear}>
            {clearLabel}
          </Button>
        ) : null}
      </XStack>
      {items.length === 0 ? (
        <Paragraph color="$color10" paddingHorizontal="$4">
          {emptyLabel}
        </Paragraph>
      ) : (
        items.map((item) => (
          <XStack
            key={item.id}
            minHeight={44}
            paddingHorizontal="$4"
            alignItems="center"
            gap="$3"
            cursor="pointer"
            hoverStyle={{ backgroundColor: '$color2' }}
            pressStyle={{ backgroundColor: '$color3' }}
            role="button"
            onPress={() => onSelect(item.query)}
          >
            <History size={18} color="$color9" />
            <Text color="$color12" flex={1} numberOfLines={1}>
              {item.query}
            </Text>
          </XStack>
        ))
      )}
    </YStack>
  );
}

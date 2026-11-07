'use client';

import { Heart, MessageCircle, Share2 } from '@tamagui/lucide-icons';
import { type ReactNode } from 'react';
import { Text, XStack } from 'tamagui';

export interface PostActionsProps {
  liked: boolean;
  likes: number;
  comments: number;
  shares: number;
  labels: { like: string; unlike: string; comment: string; share: string };
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
}

function Action({
  icon,
  count,
  label,
  onPress,
  pressed,
  active,
}: {
  icon: ReactNode;
  count: number;
  label: string;
  onPress: () => void;
  pressed?: boolean;
  active?: boolean;
}) {
  return (
    <XStack
      minHeight={44}
      minWidth={44}
      paddingHorizontal="$2"
      alignItems="center"
      gap="$1.5"
      borderRadius="$10"
      cursor="pointer"
      hoverStyle={{ backgroundColor: '$color3' }}
      pressStyle={{ opacity: 0.6 }}
      onPress={onPress}
      role="button"
      aria-label={label}
      aria-pressed={pressed}
    >
      {icon}
      <Text
        fontSize="$3"
        color={active ? '$red10' : '$color10'}
        fontWeight={active ? '700' : '400'}
      >
        {count}
      </Text>
    </XStack>
  );
}

/** Barra de acciones de una publicación: Me gusta, comentar y compartir. */
export function PostActions({
  liked,
  likes,
  comments,
  shares,
  labels,
  onLike,
  onComment,
  onShare,
}: PostActionsProps) {
  return (
    <XStack gap="$3" marginLeft="$-2">
      <Action
        icon={
          <Heart
            size={20}
            color={liked ? '$red10' : '$color10'}
            fill={liked ? 'currentColor' : 'none'}
          />
        }
        count={likes}
        label={liked ? labels.unlike : labels.like}
        pressed={liked}
        active={liked}
        onPress={onLike}
      />
      <Action
        icon={<MessageCircle size={20} color="$color10" />}
        count={comments}
        label={labels.comment}
        onPress={onComment}
      />
      <Action
        icon={<Share2 size={20} color="$color10" />}
        count={shares}
        label={labels.share}
        onPress={onShare}
      />
    </XStack>
  );
}

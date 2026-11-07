'use client';

import { Bell } from '@tamagui/lucide-icons';
import { type ReactNode } from 'react';
import { Paragraph, Text, XStack, YStack } from 'tamagui';

/** Globo con un número (p. ej. notificaciones sin leer). No se muestra con 0. */
export function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <YStack
      position="absolute"
      top={4}
      right={4}
      minWidth={18}
      height={18}
      paddingHorizontal={4}
      borderRadius={9}
      backgroundColor="$red10"
      alignItems="center"
      justifyContent="center"
      aria-hidden
    >
      <Text color="white" fontSize={11} fontWeight="700">
        {count > 99 ? '99+' : count}
      </Text>
    </YStack>
  );
}

export interface BellButtonProps {
  count: number;
  /** Etiqueta accesible que incluye el número, p. ej. "Notificaciones (2 sin leer)". */
  label: string;
  onPress?: () => void;
}

/** Campana con contador de no leídas. */
export function BellButton({ count, label, onPress }: BellButtonProps) {
  return (
    <YStack
      width={44}
      height={44}
      alignItems="center"
      justifyContent="center"
      borderRadius={22}
      cursor="pointer"
      hoverStyle={{ backgroundColor: '$color3' }}
      pressStyle={{ opacity: 0.6 }}
      role={onPress ? 'button' : undefined}
      aria-label={label}
      onPress={onPress}
    >
      <Bell size={22} color="$color11" />
      <Badge count={count} />
    </YStack>
  );
}

export interface NotificationItemProps {
  avatar: ReactNode;
  text: string;
  message?: string | null;
  timeLabel: string;
  unread: boolean;
  onPress?: () => void;
}

/** Fila de notificación; las no leídas llevan fondo y punto. */
export function NotificationItem({
  avatar,
  text,
  message,
  timeLabel,
  unread,
  onPress,
}: NotificationItemProps) {
  return (
    <XStack
      gap="$3"
      paddingHorizontal="$4"
      paddingVertical="$3"
      alignItems="flex-start"
      backgroundColor={unread ? '$blue2' : '$background'}
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      cursor={onPress ? 'pointer' : undefined}
      hoverStyle={onPress ? { backgroundColor: '$color2' } : undefined}
      onPress={onPress}
      role={onPress ? 'link' : undefined}
    >
      {avatar}
      <YStack flex={1} gap="$1">
        <Paragraph color="$color12" fontWeight={unread ? '600' : '400'}>
          {text}
        </Paragraph>
        {message ? (
          <Paragraph color="$color11" fontStyle="italic">
            “{message}”
          </Paragraph>
        ) : null}
        <Text fontSize="$2" color="$color10">
          {timeLabel}
        </Text>
      </YStack>
      {unread ? (
        <YStack width={10} height={10} borderRadius={5} backgroundColor="$blue10" marginTop="$2" />
      ) : null}
    </XStack>
  );
}

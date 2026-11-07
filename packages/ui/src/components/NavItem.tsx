'use client';

import { type Home } from '@tamagui/lucide-icons';
import { type ColorTokens, Text, YStack, XStack } from 'tamagui';

/** Componente de ícono (misma forma que los de @tamagui/lucide-icons; acepta tokens de color). */
export type NavIcon = typeof Home;

export interface NavItemProps {
  icon: NavIcon;
  label: string;
  active?: boolean;
  onPress?: () => void;
  /**
   * `stacked`: ícono sobre la etiqueta (barra inferior en móvil).
   * `inline`: ícono y etiqueta en línea (barra superior en web).
   */
  orientation?: 'stacked' | 'inline';
}

/** Tamaño mínimo de toque recomendado (44 pt en iOS, 48 dp en Android). */
export const NAV_ITEM_MIN_TOUCH = 44;

/**
 * Elemento de navegación compartido por la barra inferior (móvil) y la superior (web).
 * La semántica de enlace (`href`, `aria-current`) la pone cada plataforma alrededor.
 */
export function NavItem({
  icon: Icon,
  label,
  active = false,
  onPress,
  orientation = 'stacked',
}: NavItemProps) {
  const color = active ? '$blue10' : '$color10';
  const Stack = orientation === 'stacked' ? YStack : XStack;

  return (
    <Stack
      minHeight={NAV_ITEM_MIN_TOUCH}
      minWidth={NAV_ITEM_MIN_TOUCH}
      flex={orientation === 'stacked' ? 1 : undefined}
      alignItems="center"
      justifyContent="center"
      gap={orientation === 'stacked' ? '$1' : '$2'}
      paddingHorizontal="$3"
      paddingVertical="$2"
      borderRadius="$4"
      cursor="pointer"
      backgroundColor={active && orientation === 'inline' ? '$color3' : 'transparent'}
      hoverStyle={{ backgroundColor: '$color3' }}
      pressStyle={{ opacity: 0.7 }}
      onPress={onPress}
      role={onPress ? 'tab' : undefined}
      aria-selected={onPress ? active : undefined}
      aria-label={label}
    >
      <Icon size={22} color={color as ColorTokens} />
      <Text
        fontSize={orientation === 'stacked' ? '$2' : '$4'}
        fontWeight={active ? '700' : '500'}
        color={color}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Stack>
  );
}

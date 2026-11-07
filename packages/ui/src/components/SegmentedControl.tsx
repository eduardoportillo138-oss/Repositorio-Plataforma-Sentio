'use client';

import { Text, XStack } from 'tamagui';

export interface SegmentedOption<V extends string> {
  value: V;
  label: string;
}

export interface SegmentedControlProps<V extends string> {
  options: readonly SegmentedOption<V>[];
  value: V;
  onChange: (value: V) => void;
  /** Nombre accesible del grupo, p. ej. "Tipo de resultado". */
  label: string;
}

/**
 * Botones segmentados de los que solo uno está activo (pestañas). Cada segmento es enfocable
 * (Tab + Enter en web) y mide al menos 44 de alto.
 */
export function SegmentedControl<V extends string>({
  options,
  value,
  onChange,
  label,
}: SegmentedControlProps<V>) {
  return (
    <XStack
      role="tablist"
      aria-label={label}
      backgroundColor="$color3"
      borderRadius="$10"
      padding="$1"
      gap="$1"
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <XStack
            key={o.value}
            flex={1}
            minHeight={44}
            alignItems="center"
            justifyContent="center"
            borderRadius="$10"
            backgroundColor={selected ? '$background' : 'transparent'}
            shadowColor={selected ? '$shadowColor' : undefined}
            shadowRadius={selected ? 2 : 0}
            cursor="pointer"
            pressStyle={{ opacity: 0.7 }}
            role="tab"
            aria-selected={selected}
            onPress={() => onChange(o.value)}
          >
            <Text fontWeight={selected ? '700' : '500'} color={selected ? '$color12' : '$color10'}>
              {o.label}
            </Text>
          </XStack>
        );
      })}
    </XStack>
  );
}

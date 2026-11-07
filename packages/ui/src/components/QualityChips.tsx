'use client';

import { Paragraph, XStack, YStack } from 'tamagui';
import { Chip } from './Chip';

export interface QualityOption {
  key: string;
  label: string;
}

export interface QualityChipsProps {
  options: readonly QualityOption[];
  selected: readonly string[];
  onChange: (selected: string[]) => void;
  max: number;
  /** Mensaje cuando se alcanza el máximo (ya traducido), p. ej. "Puedes elegir hasta 3". */
  limitMessage: string;
  error?: string | null;
}

/**
 * Selector de cualidades en chips. Al llegar al máximo, los no elegidos se deshabilitan
 * y se muestra `limitMessage`. Los elegidos siempre se pueden quitar.
 */
export function QualityChips({
  options,
  selected,
  onChange,
  max,
  limitMessage,
  error,
}: QualityChipsProps) {
  const full = selected.length >= max;

  const toggle = (key: string) => {
    if (selected.includes(key)) onChange(selected.filter((k) => k !== key));
    else if (!full) onChange([...selected, key]);
  };

  return (
    <YStack gap="$2">
      <XStack flexWrap="wrap" gap="$2" role="group">
        {options.map((o) => {
          const isSelected = selected.includes(o.key);
          return (
            <Chip
              key={o.key}
              label={o.label}
              selected={isSelected}
              disabled={full && !isSelected}
              onPress={() => toggle(o.key)}
            />
          );
        })}
      </XStack>
      {error ? (
        <Paragraph size="$2" color="$red10" role="alert">
          {error}
        </Paragraph>
      ) : full ? (
        <Paragraph size="$2" color="$color10" aria-live="polite">
          {limitMessage}
        </Paragraph>
      ) : null}
    </YStack>
  );
}

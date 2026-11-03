'use client';

import { type ReactNode, useId } from 'react';
import { Checkbox, Label, Paragraph, Text, XStack, YStack } from 'tamagui';

export interface CheckboxFieldProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: ReactNode;
  error?: string | null;
}

export function CheckboxField({ checked, onCheckedChange, label, error }: CheckboxFieldProps) {
  const id = useId();
  return (
    <YStack gap="$1">
      <XStack gap="$3" alignItems="flex-start">
        <Checkbox
          id={id}
          size="$4"
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          aria-invalid={Boolean(error)}
          borderColor={error ? '$red8' : '$borderColor'}
        >
          <Checkbox.Indicator>
            <Text>✓</Text>
          </Checkbox.Indicator>
        </Checkbox>
        <Label htmlFor={id} flex={1} size="$3" lineHeight="$4">
          {label}
        </Label>
      </XStack>
      {error ? (
        <Paragraph size="$2" color="$red10" role="alert">
          {error}
        </Paragraph>
      ) : null}
    </YStack>
  );
}

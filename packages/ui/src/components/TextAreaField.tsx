'use client';

import { useId } from 'react';
import { Label, Paragraph, TextArea, type TextAreaProps, XStack, YStack } from 'tamagui';

export interface TextAreaFieldProps extends Omit<TextAreaProps, 'id' | 'maxLength'> {
  label: string;
  value: string;
  maxLength: number;
  /** Texto del contador ya traducido, p. ej. "120/300". */
  counter: string;
  error?: string | null;
}

/** Área de texto con contador de caracteres. */
export function TextAreaField({
  label,
  value,
  maxLength,
  counter,
  error,
  ...props
}: TextAreaFieldProps) {
  const id = useId();
  const over = value.length > maxLength;
  return (
    <YStack gap="$1">
      <Label htmlFor={id} size="$3">
        {label}
      </Label>
      <TextArea
        id={id}
        value={value}
        minHeight={110}
        size="$4"
        borderColor={error || over ? '$red8' : '$borderColor'}
        aria-invalid={Boolean(error) || over}
        {...props}
      />
      <XStack justifyContent="space-between" gap="$2">
        <Paragraph size="$2" color="$red10" role={error ? 'alert' : undefined} flex={1}>
          {error ?? ''}
        </Paragraph>
        <Paragraph size="$2" color={over ? '$red10' : '$color10'} aria-live="polite">
          {counter}
        </Paragraph>
      </XStack>
    </YStack>
  );
}

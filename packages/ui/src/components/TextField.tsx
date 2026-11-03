'use client';

import { useId } from 'react';
import { Input, type InputProps, Label, Paragraph, YStack } from 'tamagui';

export interface TextFieldProps extends Omit<InputProps, 'id'> {
  label: string;
  hint?: string;
  error?: string | null;
}

export function TextField({ label, hint, error, ...input }: TextFieldProps) {
  const id = useId();
  return (
    <YStack gap="$1">
      <Label htmlFor={id} size="$3">
        {label}
      </Label>
      <Input
        id={id}
        size="$4"
        borderColor={error ? '$red8' : '$borderColor'}
        aria-invalid={Boolean(error)}
        {...input}
      />
      {error ? (
        <Paragraph size="$2" color="$red10" role="alert">
          {error}
        </Paragraph>
      ) : hint ? (
        <Paragraph size="$2" color="$color10">
          {hint}
        </Paragraph>
      ) : null}
    </YStack>
  );
}

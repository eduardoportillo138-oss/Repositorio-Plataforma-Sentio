'use client';

import { Send } from '@tamagui/lucide-icons';
import { Input, Paragraph, Spinner, XStack, YStack } from 'tamagui';

export interface CommentComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  sending: boolean;
  placeholder: string;
  sendLabel: string;
  maxLength: number;
  error?: string | null;
}

/** Campo de una línea para comentar, con botón de enviar. */
export function CommentComposer({
  value,
  onChange,
  onSubmit,
  sending,
  placeholder,
  sendLabel,
  maxLength,
  error,
}: CommentComposerProps) {
  const canSend = value.trim().length > 0 && !sending;
  return (
    <YStack gap="$1" padding="$3" borderTopWidth={1} borderTopColor="$borderColor">
      <XStack gap="$2" alignItems="center">
        <Input
          flex={1}
          size="$4"
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          aria-label={placeholder}
          maxLength={maxLength}
          aria-invalid={Boolean(error)}
          borderColor={error ? '$red8' : '$borderColor'}
          returnKeyType="send"
          onSubmitEditing={() => canSend && onSubmit()}
        />
        <YStack
          width={44}
          height={44}
          alignItems="center"
          justifyContent="center"
          borderRadius={22}
          backgroundColor={canSend ? '$blue10' : '$color5'}
          cursor={canSend ? 'pointer' : 'default'}
          role="button"
          aria-label={sendLabel}
          aria-disabled={!canSend}
          onPress={canSend ? onSubmit : undefined}
        >
          {sending ? <Spinner color="white" /> : <Send size={18} color="white" />}
        </YStack>
      </XStack>
      {error ? (
        <Paragraph size="$2" color="$red10" role="alert">
          {error}
        </Paragraph>
      ) : null}
    </YStack>
  );
}

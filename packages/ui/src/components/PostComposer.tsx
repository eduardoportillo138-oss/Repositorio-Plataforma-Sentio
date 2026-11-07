'use client';

import { Label, XStack, YStack } from 'tamagui';
import { Button } from './Button';
import { Chip } from './Chip';
import { FormMessage } from './FormMessage';
import { TextAreaField } from './TextAreaField';
import { TextField } from './TextField';

export interface PostComposerLabels {
  title: string;
  titlePlaceholder: string;
  text: string;
  textPlaceholder: string;
  textCounter: string;
  visibility: string;
  visibilityPublic: string;
  visibilityFollowers: string;
  publish: string;
  cancel: string;
}

export interface PostComposerProps {
  labels: PostComposerLabels;
  title: string;
  onTitleChange: (v: string) => void;
  text: string;
  onTextChange: (v: string) => void;
  textMaxLength: number;
  visibility: 'public' | 'followers';
  onVisibilityChange: (v: 'public' | 'followers') => void;
  errors: { form?: string | null; title?: string | null; text?: string | null };
  saving: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

/** Formulario "Nueva publicación" compartido (va dentro de un diálogo en web y un modal en móvil). */
export function PostComposer({
  labels,
  title,
  onTitleChange,
  text,
  onTextChange,
  textMaxLength,
  visibility,
  onVisibilityChange,
  errors,
  saving,
  onSubmit,
  onCancel,
}: PostComposerProps) {
  return (
    <YStack gap="$3">
      <FormMessage>{errors.form}</FormMessage>
      <TextField
        label={labels.title}
        placeholder={labels.titlePlaceholder}
        value={title}
        onChangeText={onTitleChange}
        maxLength={120}
        autoFocus
        error={errors.title}
      />
      <TextAreaField
        label={labels.text}
        placeholder={labels.textPlaceholder}
        value={text}
        onChangeText={onTextChange}
        maxLength={textMaxLength}
        counter={labels.textCounter}
        error={errors.text}
      />
      <YStack gap="$2">
        <Label size="$3">{labels.visibility}</Label>
        <XStack gap="$2" role="radiogroup" aria-label={labels.visibility}>
          <Chip
            label={labels.visibilityPublic}
            selected={visibility === 'public'}
            onPress={() => onVisibilityChange('public')}
          />
          <Chip
            label={labels.visibilityFollowers}
            selected={visibility === 'followers'}
            onPress={() => onVisibilityChange('followers')}
          />
        </XStack>
      </YStack>
      <XStack gap="$2" justifyContent="flex-end" flexWrap="wrap">
        <Button tone="ghost" onPress={onCancel} disabled={saving}>
          {labels.cancel}
        </Button>
        <Button loading={saving} onPress={onSubmit}>
          {labels.publish}
        </Button>
      </XStack>
    </YStack>
  );
}

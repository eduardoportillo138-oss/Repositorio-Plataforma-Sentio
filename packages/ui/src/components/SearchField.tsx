'use client';

import { Search, X } from '@tamagui/lucide-icons';
import { Input, type InputProps, XStack, YStack } from 'tamagui';

export interface SearchFieldProps extends Omit<InputProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeText: (value: string) => void;
  /** Etiqueta accesible del campo. */
  label: string;
  clearLabel: string;
}

/** Campo de búsqueda con lupa y botón para limpiar (zona de toque de 44). */
export function SearchField({
  value,
  onChangeText,
  label,
  clearLabel,
  ...input
}: SearchFieldProps) {
  return (
    <XStack
      alignItems="center"
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius="$10"
      backgroundColor="$color2"
      paddingLeft="$3"
    >
      <Search size={18} color="$color10" />
      <Input
        flex={1}
        size="$4"
        value={value}
        onChangeText={onChangeText}
        aria-label={label}
        borderWidth={0}
        backgroundColor="transparent"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        {...input}
      />
      {value ? (
        <YStack
          width={44}
          height={44}
          alignItems="center"
          justifyContent="center"
          borderRadius={22}
          cursor="pointer"
          pressStyle={{ opacity: 0.6 }}
          role="button"
          aria-label={clearLabel}
          onPress={() => onChangeText('')}
        >
          <X size={18} color="$color10" />
        </YStack>
      ) : null}
    </XStack>
  );
}

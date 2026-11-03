'use client';

import { Button as TButton, type ButtonProps as TButtonProps, Spinner } from 'tamagui';

export interface ButtonProps extends Omit<TButtonProps, 'variant'> {
  loading?: boolean;
  tone?: 'primary' | 'ghost';
}

export function Button({ loading, disabled, tone = 'primary', children, ...props }: ButtonProps) {
  const primary = tone === 'primary';
  return (
    <TButton
      size="$4"
      theme={primary ? 'accent' : undefined}
      chromeless={!primary}
      disabled={disabled || loading}
      opacity={disabled || loading ? 0.6 : 1}
      icon={loading ? <Spinner /> : undefined}
      aria-busy={loading}
      {...props}
    >
      {children}
    </TButton>
  );
}

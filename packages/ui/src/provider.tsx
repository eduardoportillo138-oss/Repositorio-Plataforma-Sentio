'use client';

import { type ReactNode } from 'react';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from './tamagui.config';

export interface UIProviderProps {
  children: ReactNode;
  colorScheme?: 'light' | 'dark' | null;
}

export function UIProvider({ children, colorScheme }: UIProviderProps) {
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={colorScheme ?? 'light'}>
      {children}
    </TamaguiProvider>
  );
}

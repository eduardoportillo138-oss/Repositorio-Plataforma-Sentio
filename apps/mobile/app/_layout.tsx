import { SentioApiProvider } from '@sentio/api-client';
import { createI18n, I18nextProvider, resolveLocale } from '@sentio/i18n';
import { UIProvider } from '@sentio/ui';
import { getLocales } from 'expo-localization';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { API_URL } from '@/env';
import { createSecureTokenStorage } from '@/secure-token-storage';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const i18n = useMemo(() => createI18n(resolveLocale(getLocales().map((l) => l.languageTag))), []);
  const tokens = useMemo(() => createSecureTokenStorage(), []);

  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <UIProvider colorScheme={colorScheme}>
          <SentioApiProvider uri={API_URL} platform="native" tokens={tokens}>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="new-post" options={{ presentation: 'modal' }} />
            </Stack>
          </SentioApiProvider>
        </UIProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}

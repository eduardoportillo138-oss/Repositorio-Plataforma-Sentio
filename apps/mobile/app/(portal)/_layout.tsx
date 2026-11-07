import { useAuth } from '@sentio/api-client';
import { useTranslation } from '@sentio/i18n';
import {
  HomeIcon,
  type NavIcon,
  NavItem,
  ProfileIcon,
  SearchIcon,
  Spinner,
  XStack,
  YStack,
} from '@sentio/ui';
import { Redirect, Tabs } from 'expo-router';
import { type ComponentProps } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PostInteractionsProvider } from '@/components/PostInteractions';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

/** Pestañas del portal, en el orden en que aparecen en la barra. */
const TABS: readonly { name: string; icon: NavIcon; labelKey: 'home' | 'search' | 'profile' }[] = [
  { name: 'index', icon: HomeIcon, labelKey: 'home' },
  { name: 'search', icon: SearchIcon, labelKey: 'search' },
  { name: 'profile', icon: ProfileIcon, labelKey: 'profile' },
];

function PortalTabBar({ state, navigation }: TabBarProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <XStack
      role="tablist"
      aria-label={t('portal.nav.label')}
      backgroundColor="$background"
      borderTopWidth={1}
      borderTopColor="$borderColor"
      paddingTop="$1"
      paddingBottom={Math.max(insets.bottom, 8)}
      paddingHorizontal="$2"
    >
      {state.routes.map((route, index) => {
        const tab = TABS.find((x) => x.name === route.name);
        if (!tab) return null;
        const active = state.index === index;
        return (
          <NavItem
            key={route.key}
            icon={tab.icon}
            label={t(`portal.nav.${tab.labelKey}`)}
            active={active}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!active && !event.defaultPrevented) navigation.navigate(route.name);
            }}
          />
        );
      })}
    </XStack>
  );
}

export default function PortalLayout() {
  const { status } = useAuth();

  if (status === 'anonymous') return <Redirect href="/login" />;
  if (status === 'loading') {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
        <Spinner size="large" />
      </YStack>
    );
  }

  return (
    <PostInteractionsProvider>
      <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <PortalTabBar {...props} />}>
        {TABS.map((tab) => (
          <Tabs.Screen key={tab.name} name={tab.name} />
        ))}
        {/* Rutas del portal sin pestaña propia. */}
        <Tabs.Screen name="u/[handle]" options={{ href: null }} />
        <Tabs.Screen name="post/[id]" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
      </Tabs>
    </PostInteractionsProvider>
  );
}

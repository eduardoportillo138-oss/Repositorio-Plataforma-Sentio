'use client';

import { useAuth } from '@sentio/api-client';
import { useTranslation } from '@sentio/i18n';
import {
  Button,
  HomeIcon,
  LogOutIcon,
  type NavIcon,
  NavItem,
  ProfileIcon,
  SearchIcon,
  Spinner,
  Text,
  XStack,
  YStack,
} from '@sentio/ui';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

/** Secciones del portal; `segment` es la ruta sin el prefijo de idioma. */
const SECTIONS: readonly {
  segment: string;
  icon: NavIcon;
  labelKey: 'home' | 'search' | 'profile';
}[] = [
  { segment: '', icon: HomeIcon, labelKey: 'home' },
  { segment: 'search', icon: SearchIcon, labelKey: 'search' },
  { segment: 'profile', icon: ProfileIcon, labelKey: 'profile' },
];

/** La sección está activa si la ruta es exactamente ella o una subruta suya (Inicio solo exacta). */
function isActive(pathname: string, locale: string, segment: string): boolean {
  const base = segment ? `/${locale}/${segment}` : `/${locale}`;
  if (!segment) return pathname === base;
  return pathname === base || pathname.startsWith(`${base}/`);
}

export default function PortalLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { status, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useParams<{ locale: string }>();

  useEffect(() => {
    if (status === 'anonymous') router.replace(`/${locale}/login`);
  }, [status, locale, router]);

  if (status !== 'authenticated') {
    return (
      <YStack minHeight="100vh" alignItems="center" justifyContent="center">
        <Spinner size="large" aria-label={t('common.loading')} />
      </YStack>
    );
  }

  return (
    <YStack minHeight="100vh" backgroundColor="$background">
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <XStack
          backgroundColor="$background"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
          paddingHorizontal="$4"
          paddingVertical="$2"
          alignItems="center"
          gap="$4"
          flexWrap="wrap"
        >
          <Link href={`/${locale}`} style={{ textDecoration: 'none' }}>
            <Text fontSize="$7" fontWeight="800" color="$blue10">
              {t('common.appName')}
            </Text>
          </Link>

          <nav aria-label={t('portal.nav.label')} style={{ flex: 1 }}>
            <XStack gap="$1" alignItems="center">
              {SECTIONS.map((s) => {
                const active = isActive(pathname, locale, s.segment);
                const label = t(`portal.nav.${s.labelKey}`);
                return (
                  <Link
                    key={s.labelKey}
                    href={s.segment ? `/${locale}/${s.segment}` : `/${locale}`}
                    aria-current={active ? 'page' : undefined}
                    style={{ textDecoration: 'none' }}
                  >
                    <NavItem icon={s.icon} label={label} active={active} orientation="inline" />
                  </Link>
                );
              })}
            </XStack>
          </nav>

          <XStack gap="$3" alignItems="center">
            <LanguageSwitcher marginTop="$0" />
            <Button
              tone="ghost"
              minHeight={44}
              icon={<LogOutIcon size={18} />}
              onPress={() => void logout()}
            >
              {t('portal.logout')}
            </Button>
          </XStack>
        </XStack>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</main>
    </YStack>
  );
}

import { useTranslation } from '@sentio/i18n';
import { BackIcon, H3, NAV_ITEM_MIN_TOUCH, XStack, YStack } from '@sentio/ui';
import { useRouter } from 'expo-router';

/** Encabezado de pantalla secundaria con botón Volver (zona de toque de 44 pt). */
export function ScreenHeader({ title }: { title: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <XStack alignItems="center" gap="$2" paddingHorizontal="$2" paddingVertical="$1">
      <YStack
        width={NAV_ITEM_MIN_TOUCH}
        height={NAV_ITEM_MIN_TOUCH}
        alignItems="center"
        justifyContent="center"
        borderRadius="$10"
        pressStyle={{ backgroundColor: '$color3' }}
        role="button"
        aria-label={t('profile.view.back')}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
      >
        <BackIcon size={24} />
      </YStack>
      <H3 flex={1} numberOfLines={1}>
        {title}
      </H3>
    </XStack>
  );
}

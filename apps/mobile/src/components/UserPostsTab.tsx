import { useTranslation } from '@sentio/i18n';
import { Text, XStack } from '@sentio/ui';

/** Encabezado de la pestaña "Publicaciones" del perfil. */
export function UserPostsTab() {
  const { t } = useTranslation();
  return (
    <XStack role="tablist" borderBottomWidth={1} borderBottomColor="$borderColor">
      <Text
        role="tab"
        aria-selected
        paddingHorizontal="$4"
        paddingVertical="$3"
        fontWeight="700"
        color="$blue10"
        borderBottomWidth={2}
        borderBottomColor="$blue10"
      >
        {t('profile.tabs.posts')}
      </Text>
    </XStack>
  );
}

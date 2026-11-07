import { useTranslation } from '@sentio/i18n';
import { CloseIcon, H3, XStack, YStack } from '@sentio/ui';
import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Alto máximo como fracción de la pantalla. */
  heightRatio?: number;
}

/**
 * Hoja inferior basada en el Modal nativo: sube desde abajo, se cierra con el botón, tocando
 * el fondo o con el gesto/botón Atrás de Android, y respeta el teclado y la safe area.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  heightRatio = 0.85,
}: BottomSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel={t('comments.close')}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { maxHeight: `${Math.round(heightRatio * 100)}%` }]}
      >
        <YStack
          backgroundColor="$background"
          borderTopLeftRadius="$6"
          borderTopRightRadius="$6"
          paddingBottom={insets.bottom}
          height="100%"
        >
          <YStack
            alignSelf="center"
            width={40}
            height={4}
            borderRadius={2}
            backgroundColor="$color6"
            marginTop="$2"
          />
          <XStack
            alignItems="center"
            justifyContent="space-between"
            paddingHorizontal="$4"
            paddingVertical="$2"
          >
            <H3>{title}</H3>
            <YStack
              width={44}
              height={44}
              alignItems="center"
              justifyContent="center"
              borderRadius={22}
              pressStyle={{ backgroundColor: '$color3' }}
              role="button"
              aria-label={t('comments.close')}
              onPress={onClose}
            >
              <CloseIcon size={22} />
            </YStack>
          </XStack>
          <YStack flex={1}>{children}</YStack>
        </YStack>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  container: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '85%' },
});

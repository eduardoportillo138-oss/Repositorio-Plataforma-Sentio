'use client';

import { useTranslation } from '@sentio/i18n';
import { CloseIcon, H3, XStack, YStack } from '@sentio/ui';
import { type CSSProperties, type ReactNode, useEffect, useId, useRef } from 'react';

export interface ModalDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** `side`: panel lateral a toda altura (comentarios). `center`: diálogo centrado. */
  variant?: 'side' | 'center';
}

const styles: Record<'side' | 'center', CSSProperties> = {
  side: {
    margin: '0 0 0 auto',
    height: '100dvh',
    maxHeight: '100dvh',
    width: 'min(480px, 100vw)',
    borderRadius: 0,
  },
  center: {
    width: 'min(560px, calc(100vw - 32px))',
    maxHeight: 'calc(100dvh - 64px)',
    borderRadius: 16,
  },
};

/**
 * Diálogo modal nativo (<dialog>): atrapa el foco, se cierra con Escape o con clic en el fondo,
 * y devuelve el foco al elemento que lo abrió.
 */
export function ModalDialog({
  open,
  onClose,
  title,
  children,
  variant = 'center',
}: ModalDialogProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      style={{ border: 'none', padding: 0, overflow: 'hidden', ...styles[variant] }}
    >
      {open ? (
        <YStack
          height="100%"
          maxHeight={variant === 'side' ? '100dvh' : 'calc(100dvh - 64px)'}
          backgroundColor="$background"
        >
          <XStack
            alignItems="center"
            justifyContent="space-between"
            paddingHorizontal="$4"
            paddingVertical="$2"
            borderBottomWidth={1}
            borderBottomColor="$borderColor"
          >
            <H3 id={titleId}>{title}</H3>
            <YStack
              width={44}
              height={44}
              alignItems="center"
              justifyContent="center"
              borderRadius={22}
              cursor="pointer"
              hoverStyle={{ backgroundColor: '$color3' }}
              role="button"
              aria-label={t('comments.close')}
              onPress={onClose}
            >
              <CloseIcon size={20} />
            </YStack>
          </XStack>
          <YStack flex={1} overflow="scroll">
            {children}
          </YStack>
        </YStack>
      ) : null}
    </dialog>
  );
}

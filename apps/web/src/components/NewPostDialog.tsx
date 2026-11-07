'use client';

import { POST_TEXT_MAX_LENGTH, useCreatePostForm } from '@sentio/api-client';
import { useDynamicT, useTranslation } from '@sentio/i18n';
import { H3, PostComposer, YStack } from '@sentio/ui';
import { useEffect, useId, useRef } from 'react';

export interface NewPostDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Diálogo modal nativo (<dialog>): atrapa el foco, se cierra con Escape y devuelve el foco
 * al botón que lo abrió.
 */
export function NewPostDialog({ open, onClose }: NewPostDialogProps) {
  const { t } = useTranslation();
  const tr = useDynamicT();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const form = useCreatePostForm(() => onClose());

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const cancel = () => {
    form.reset();
    onClose();
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={cancel}
      onClick={(e) => {
        // Clic en el fondo (fuera del contenido) cierra.
        if (e.target === ref.current) cancel();
      }}
      style={{
        border: 'none',
        borderRadius: 16,
        padding: 0,
        width: 'min(560px, calc(100vw - 32px))',
        maxHeight: 'calc(100vh - 64px)',
      }}
    >
      {open ? (
        <YStack padding="$5" gap="$4" backgroundColor="$background">
          <H3 id={titleId}>{t('post.newPost')}</H3>
          <PostComposer
            labels={{
              title: t('post.title'),
              titlePlaceholder: t('post.titlePlaceholder'),
              text: t('post.text'),
              textPlaceholder: t('post.textPlaceholder'),
              textCounter: t('post.counter', {
                length: String(form.text.length),
                max: String(POST_TEXT_MAX_LENGTH),
              }),
              visibility: t('post.visibility'),
              visibilityPublic: t('post.visibilityPublic'),
              visibilityFollowers: t('post.visibilityFollowers'),
              publish: t('post.publish'),
              cancel: t('post.cancel'),
            }}
            title={form.title}
            onTitleChange={form.setTitle}
            text={form.text}
            onTextChange={form.setText}
            textMaxLength={POST_TEXT_MAX_LENGTH}
            visibility={form.visibility}
            onVisibilityChange={form.setVisibility}
            errors={{
              form: tr(form.errors.form),
              title: tr(form.errors.fields.title),
              text: tr(form.errors.fields.text),
            }}
            saving={form.saving}
            onSubmit={() => void form.submit()}
            onCancel={cancel}
          />
        </YStack>
      ) : null}
    </dialog>
  );
}

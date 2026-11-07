'use client';

import {
  postShareUrl,
  SHARE_MAX_RECIPIENTS,
  useAuth,
  type UserSearchFieldsFragment,
  useSharePost,
  useUserSearch,
} from '@sentio/api-client';
import { useDynamicT, useTranslation } from '@sentio/i18n';
import {
  Button,
  FormMessage,
  LinkIcon,
  Notice,
  Paragraph,
  SearchIcon,
  Spinner,
  TextField,
  UserRow,
  XStack,
  YStack,
} from '@sentio/ui';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { UserAvatar } from './UserAvatar';

type Picked = UserSearchFieldsFragment;

export interface ShareFormProps {
  postId: string;
  postTitle: string;
  onDone: () => void;
}

/** Selector de personas (búsqueda con debounce), mensaje opcional y compartir fuera de la app. */
export function ShareForm({ postId, postTitle, onDone }: ShareFormProps) {
  const { t } = useTranslation();
  const tr = useDynamicT();
  const { viewer } = useAuth();
  const { locale } = useParams<{ locale: string }>();
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');
  const [picked, setPicked] = useState<Picked[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const search = useUserSearch(text);
  const { share, sending, errors } = useSharePost(postId);

  const full = picked.length >= SHARE_MAX_RECIPIENTS;
  const results = search.items.filter((u) => u.id !== viewer?.id);

  const toggle = (u: Picked) =>
    setPicked((p) =>
      p.some((x) => x.id === u.id) ? p.filter((x) => x.id !== u.id) : full ? p : [...p, u],
    );

  async function send() {
    const sentTo = await share(
      picked.map((p) => p.id),
      message,
    );
    if (sentTo !== null) {
      setNotice(t('share.sent', { n: String(sentTo) }));
      setPicked([]);
      setMessage('');
      setTimeout(onDone, 900);
    }
  }

  async function shareOutside() {
    const url = postShareUrl(window.location.origin, locale, postId);
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: postTitle, url });
        return;
      } catch {
        // Cancelado por el usuario o no permitido: se copia el enlace.
      }
    }
    await navigator.clipboard.writeText(url);
    setNotice(t('share.copied'));
  }

  return (
    <YStack gap="$3" padding="$4">
      <TextField
        label={t('share.searchPlaceholder')}
        value={text}
        onChangeText={setText}
        placeholder={t('share.searchPlaceholder')}
        autoComplete="off"
        hint={search.enabled ? undefined : t('share.searchHint')}
      />
      {picked.length > 0 ? (
        <Paragraph size="$2" color="$color10">
          {t('share.selected', { n: String(picked.length), max: String(SHARE_MAX_RECIPIENTS) })}
          {full ? ` · ${t('share.maxReached')}` : ''}
        </Paragraph>
      ) : null}

      <YStack
        minHeight={120}
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius="$4"
        overflow="hidden"
      >
        {search.enabled && (search.initialLoading || search.pending) ? (
          <YStack alignItems="center" padding="$4">
            <Spinner />
          </YStack>
        ) : search.enabled && results.length === 0 ? (
          <Paragraph textAlign="center" color="$color10" padding="$4">
            {t('share.noResults', { query: search.query })}
          </Paragraph>
        ) : (
          // Las personas elegidas se mantienen visibles aunque cambie la búsqueda.
          [...picked.filter((p) => !results.some((r) => r.id === p.id)), ...results].map((u) => {
            const selected = picked.some((p) => p.id === u.id);
            return (
              <UserRow
                key={u.id}
                avatar={<UserAvatar name={u.displayName} avatar={u.avatar} size={36} />}
                displayName={u.displayName}
                handle={u.handle}
                selected={selected}
                disabled={full && !selected}
                onPress={() => toggle(u)}
              />
            );
          })
        )}
        {!search.enabled && picked.length === 0 ? (
          <XStack justifyContent="center" padding="$4" opacity={0.5}>
            <SearchIcon size={28} />
          </XStack>
        ) : null}
      </YStack>

      <TextField
        label={t('share.message')}
        value={message}
        onChangeText={setMessage}
        maxLength={500}
        error={tr(errors.fields.message)}
      />
      <FormMessage>{tr(errors.fields.recipientIds ?? errors.form)}</FormMessage>
      {notice ? <Notice tone="success">{notice}</Notice> : null}

      <XStack gap="$2" justifyContent="space-between" flexWrap="wrap">
        <Button tone="ghost" icon={<LinkIcon size={18} />} onPress={() => void shareOutside()}>
          {t('share.outside')}
        </Button>
        <Button loading={sending} disabled={picked.length === 0} onPress={() => void send()}>
          {t('share.send')}
        </Button>
      </XStack>
    </YStack>
  );
}

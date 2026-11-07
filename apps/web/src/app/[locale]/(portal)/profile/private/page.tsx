'use client';

import { usePrivateContactForm } from '@sentio/api-client';
import { useDynamicT, useTranslation } from '@sentio/i18n';
import {
  Button,
  FormMessage,
  Notice,
  PageContainer,
  Spinner,
  TextField,
  XStack,
  YStack,
} from '@sentio/ui';
import { useParams, useRouter } from 'next/navigation';

export default function PrivateInfoPage() {
  const { t } = useTranslation();
  const tr = useDynamicT();
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const form = usePrivateContactForm();

  if (form.loading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$6">
        <Spinner size="large" />
      </YStack>
    );
  }

  const err = (field: string) => tr(form.errors.fields[field]);

  return (
    <PageContainer title={t('profile.private.title')}>
      <Notice tone="private">{t('profile.private.notice')}</Notice>
      <FormMessage>{tr(form.errors.form)}</FormMessage>

      <TextField
        label={t('profile.private.phone')}
        hint={t('profile.private.phoneHint')}
        value={form.values.phone}
        onChangeText={(v) => form.setField('phone', v)}
        inputMode="tel"
        autoComplete="tel"
        error={err('phone')}
      />
      <TextField
        label={t('profile.private.altEmail')}
        value={form.values.altEmail}
        onChangeText={(v) => form.setField('altEmail', v)}
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        error={err('altEmail')}
      />
      <TextField
        label={t('profile.private.institution')}
        value={form.values.institution}
        onChangeText={(v) => form.setField('institution', v)}
        autoComplete="organization"
        error={err('institution')}
      />
      <TextField
        label={t('profile.private.studentId')}
        value={form.values.studentId}
        onChangeText={(v) => form.setField('studentId', v)}
        autoCapitalize="characters"
        error={err('studentId')}
      />
      <TextField
        label={t('profile.private.emergencyContactName')}
        value={form.values.emergencyContactName}
        onChangeText={(v) => form.setField('emergencyContactName', v)}
        error={err('emergencyContactName')}
      />
      <TextField
        label={t('profile.private.emergencyContactPhone')}
        hint={t('profile.private.phoneHint')}
        value={form.values.emergencyContactPhone}
        onChangeText={(v) => form.setField('emergencyContactPhone', v)}
        inputMode="tel"
        error={err('emergencyContactPhone')}
      />

      {form.saved ? <Notice tone="success">{t('profile.private.saved')}</Notice> : null}

      <XStack gap="$2" justifyContent="flex-end" flexWrap="wrap">
        <Button tone="ghost" onPress={() => router.push(`/${locale}/profile`)}>
          {t('profile.view.back')}
        </Button>
        <Button loading={form.saving} onPress={() => void form.save()}>
          {t('profile.private.save')}
        </Button>
      </XStack>
    </PageContainer>
  );
}

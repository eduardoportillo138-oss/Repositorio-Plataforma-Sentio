'use client';

import { BIO_MAX_LENGTH, MAX_PROFILE_TAGS, useEditProfileForm } from '@sentio/api-client';
import { useDynamicT, useTranslation } from '@sentio/i18n';
import {
  Button,
  FormMessage,
  Label,
  Notice,
  PageContainer,
  Paragraph,
  QualityChips,
  Spinner,
  TextAreaField,
  TextField,
  XStack,
  YStack,
} from '@sentio/ui';
import { useParams, useRouter } from 'next/navigation';
import { AvatarPicker } from '@/components/AvatarPicker';

export default function EditProfilePage() {
  const { t } = useTranslation();
  const tr = useDynamicT();
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const form = useEditProfileForm();

  if (form.loading || !form.viewer) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$6">
        <Spinner size="large" />
      </YStack>
    );
  }

  const options = form.qualityKeys.map((key) => ({
    key,
    label: tr(`profile.qualities.${key}`) ?? key,
  }));

  return (
    <PageContainer title={t('profile.edit.title')}>
      <AvatarPicker name={form.viewer.displayName} avatar={form.viewer.avatar} />

      <YStack gap="$4">
        <FormMessage>{tr(form.errors.form)}</FormMessage>
        <TextField
          label={t('profile.edit.displayName')}
          value={form.displayName}
          onChangeText={form.setDisplayName}
          autoComplete="name"
          error={tr(form.fieldError('displayName'))}
        />
        <TextAreaField
          label={t('profile.edit.bio')}
          placeholder={t('profile.edit.bioPlaceholder')}
          value={form.bio}
          onChangeText={form.setBio}
          maxLength={BIO_MAX_LENGTH}
          counter={t('profile.edit.bioCounter', {
            length: String(form.bio.length),
            max: String(BIO_MAX_LENGTH),
          })}
          error={tr(form.fieldError('bio'))}
        />
        <YStack gap="$2">
          <Label size="$3">{t('profile.edit.tags')}</Label>
          <Paragraph size="$2" color="$color10">
            {t('profile.edit.tagsHint')}
          </Paragraph>
          <QualityChips
            options={options}
            selected={form.tags}
            onChange={form.setTags}
            max={MAX_PROFILE_TAGS}
            limitMessage={t('profile.edit.tagsLimit')}
            error={tr(form.fieldError('tags'))}
          />
        </YStack>

        {form.saved ? <Notice tone="success">{t('profile.edit.saved')}</Notice> : null}

        <XStack gap="$2" justifyContent="flex-end" flexWrap="wrap">
          <Button tone="ghost" onPress={() => router.push(`/${locale}/profile`)}>
            {t('profile.edit.cancel')}
          </Button>
          <Button
            loading={form.saving}
            onPress={() => {
              void form.save().then((ok) => {
                if (ok) router.push(`/${locale}/profile`);
              });
            }}
          >
            {t('profile.edit.save')}
          </Button>
        </XStack>
      </YStack>
    </PageContainer>
  );
}

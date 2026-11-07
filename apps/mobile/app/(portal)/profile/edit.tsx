import { BIO_MAX_LENGTH, MAX_PROFILE_TAGS, useEditProfileForm } from '@sentio/api-client';
import { useDynamicT, useTranslation } from '@sentio/i18n';
import {
  Button,
  FormMessage,
  Label,
  PageContainer,
  Paragraph,
  QualityChips,
  Spinner,
  TextAreaField,
  TextField,
  YStack,
} from '@sentio/ui';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AvatarPicker } from '@/components/AvatarPicker';
import { ScreenHeader } from '@/components/ScreenHeader';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const tr = useDynamicT();
  const router = useRouter();
  const form = useEditProfileForm();

  const options = form.qualityKeys.map((key) => ({
    key,
    label: tr(`profile.qualities.${key}`) ?? key,
  }));

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScreenHeader title={t('profile.edit.title')} />
      {form.loading || !form.viewer ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Spinner size="large" />
        </YStack>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <PageContainer>
            <AvatarPicker name={form.viewer.displayName} avatar={form.viewer.avatar} />
            <FormMessage>{tr(form.errors.form)}</FormMessage>
            <TextField
              label={t('profile.edit.displayName')}
              value={form.displayName}
              onChangeText={form.setDisplayName}
              autoComplete="name"
              textContentType="name"
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
            <Button
              loading={form.saving}
              onPress={() => {
                void form.save().then((ok) => {
                  if (ok) router.back();
                });
              }}
            >
              {t('profile.edit.save')}
            </Button>
          </PageContainer>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

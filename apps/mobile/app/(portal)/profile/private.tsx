import { usePrivateContactForm } from '@sentio/api-client';
import { useDynamicT, useTranslation } from '@sentio/i18n';
import { Button, FormMessage, Notice, PageContainer, Spinner, TextField, YStack } from '@sentio/ui';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ScreenHeader';

export default function PrivateInfoScreen() {
  const { t } = useTranslation();
  const tr = useDynamicT();
  const form = usePrivateContactForm();
  const err = (field: string) => tr(form.errors.fields[field]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScreenHeader title={t('profile.private.title')} />
      {form.loading ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Spinner size="large" />
        </YStack>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <PageContainer>
            <Notice tone="private">{t('profile.private.notice')}</Notice>
            <FormMessage>{tr(form.errors.form)}</FormMessage>
            <TextField
              label={t('profile.private.phone')}
              hint={t('profile.private.phoneHint')}
              value={form.values.phone}
              onChangeText={(v) => form.setField('phone', v)}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              error={err('phone')}
            />
            <TextField
              label={t('profile.private.altEmail')}
              value={form.values.altEmail}
              onChangeText={(v) => form.setField('altEmail', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              error={err('altEmail')}
            />
            <TextField
              label={t('profile.private.institution')}
              value={form.values.institution}
              onChangeText={(v) => form.setField('institution', v)}
              textContentType="organizationName"
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
              textContentType="name"
              error={err('emergencyContactName')}
            />
            <TextField
              label={t('profile.private.emergencyContactPhone')}
              hint={t('profile.private.phoneHint')}
              value={form.values.emergencyContactPhone}
              onChangeText={(v) => form.setField('emergencyContactPhone', v)}
              keyboardType="phone-pad"
              error={err('emergencyContactPhone')}
            />
            {form.saved ? <Notice tone="success">{t('profile.private.saved')}</Notice> : null}
            <Button loading={form.saving} onPress={() => void form.save()}>
              {t('profile.private.save')}
            </Button>
          </PageContainer>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

import {
  apiFormErrors,
  type FormErrors,
  NO_ERRORS,
  useAuth,
  validationErrors,
} from '@sentio/api-client';
import { registerSchema } from '@sentio/core';
import { resolveLocale, useDynamicT, useTranslation } from '@sentio/i18n';
import {
  AuthScreen,
  Button,
  CheckboxField,
  FormMessage,
  Paragraph,
  TextField,
  XStack,
} from '@sentio/ui';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking } from 'react-native';
import { PRIVACY_CONTACT, PRIVACY_NOTICE_URL } from '@/env';

export default function RegisterScreen() {
  const { t, i18n } = useTranslation();
  const tr = useDynamicT();
  const { register } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    displayName: '',
    handle: '',
    email: '',
    password: '',
    acceptPrivacyNotice: false,
    marketingOptIn: false,
  });
  const [errors, setErrors] = useState<FormErrors>(NO_ERRORS);
  const [submitting, setSubmitting] = useState(false);

  const set =
    <K extends keyof typeof form>(key: K) =>
    (value: (typeof form)[K]) =>
      setForm((prev) => ({ ...prev, [key]: value }));

  async function onSubmit() {
    const parsed = registerSchema.safeParse({ ...form, locale: resolveLocale([i18n.language]) });
    if (!parsed.success) {
      setErrors(validationErrors(parsed.error.issues));
      return;
    }
    setErrors(NO_ERRORS);
    setSubmitting(true);
    try {
      await register(parsed.data);
      router.replace('/');
    } catch (error) {
      setErrors(apiFormErrors(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      footer={
        <XStack gap="$2" alignItems="center">
          <Paragraph>{t('auth.register.haveAccount')}</Paragraph>
          <Link href="/login">
            <Paragraph color="$blue10">{t('auth.register.goLogin')}</Paragraph>
          </Link>
        </XStack>
      }
    >
      <FormMessage>{tr(errors.form)}</FormMessage>
      <TextField
        label={t('auth.register.displayName')}
        value={form.displayName}
        onChangeText={set('displayName')}
        autoComplete="name"
        error={tr(errors.fields.displayName)}
      />
      <TextField
        label={t('auth.register.handle')}
        value={form.handle}
        onChangeText={set('handle')}
        autoCapitalize="none"
        autoComplete="username"
        hint={t('auth.register.handleHint')}
        error={tr(errors.fields.handle)}
      />
      <TextField
        label={t('auth.register.email')}
        value={form.email}
        onChangeText={set('email')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={tr(errors.fields.email)}
      />
      <TextField
        label={t('auth.register.password')}
        value={form.password}
        onChangeText={set('password')}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        hint={t('auth.register.passwordHint')}
        error={tr(errors.fields.password)}
      />

      {/* Aviso de privacidad simplificado (LFPDPPP) antes de recabar el consentimiento. */}
      <Paragraph size="$2" color="$color10">
        {t('auth.privacy.shortNotice', { contact: PRIVACY_CONTACT, url: PRIVACY_NOTICE_URL })}
      </Paragraph>
      <Paragraph
        size="$2"
        color="$blue10"
        onPress={() => void Linking.openURL(PRIVACY_NOTICE_URL)}
        accessibilityRole="link"
      >
        {t('auth.register.privacyLink')}
      </Paragraph>
      <CheckboxField
        checked={form.acceptPrivacyNotice}
        onCheckedChange={set('acceptPrivacyNotice')}
        label={t('auth.register.acceptPrivacy')}
        error={tr(errors.fields.acceptPrivacyNotice)}
      />
      <CheckboxField
        checked={form.marketingOptIn}
        onCheckedChange={set('marketingOptIn')}
        label={t('auth.register.marketingOptIn')}
      />

      <Button loading={submitting} onPress={() => void onSubmit()}>
        {t('auth.register.submit')}
      </Button>
    </AuthScreen>
  );
}

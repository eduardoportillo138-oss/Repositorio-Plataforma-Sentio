'use client';

import {
  apiFormErrors,
  type FormErrors,
  NO_ERRORS,
  useAuth,
  validationErrors,
} from '@sentio/api-client';
import { registerSchema } from '@sentio/core';
import { isLocale, useDynamicT, useTranslation } from '@sentio/i18n';
import {
  AuthScreen,
  Button,
  CheckboxField,
  FormMessage,
  Paragraph,
  TextField,
  XStack,
} from '@sentio/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { PRIVACY_CONTACT } from '@/lib/env';

export default function RegisterPage() {
  const { t } = useTranslation();
  const tr = useDynamicT();
  const { register } = useAuth();
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

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
  const fieldError = (name: string) => tr(errors.fields[name]);
  const privacyHref = `/${locale}/aviso-de-privacidad`;

  async function onSubmit() {
    const parsed = registerSchema.safeParse({
      ...form,
      locale: isLocale(locale) ? locale : 'es',
    });
    if (!parsed.success) {
      setErrors(validationErrors(parsed.error.issues));
      return;
    }
    setErrors(NO_ERRORS);
    setSubmitting(true);
    try {
      await register(parsed.data);
      router.replace(`/${locale}`);
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
        <>
          <XStack gap="$2" alignItems="center">
            <Paragraph>{t('auth.register.haveAccount')}</Paragraph>
            <Link href={`/${locale}/login`}>{t('auth.register.goLogin')}</Link>
          </XStack>
          <LanguageSwitcher path="register" />
        </>
      }
    >
      <FormMessage>{tr(errors.form)}</FormMessage>
      <TextField
        label={t('auth.register.displayName')}
        value={form.displayName}
        onChangeText={set('displayName')}
        autoComplete="name"
        error={fieldError('displayName')}
      />
      <TextField
        label={t('auth.register.handle')}
        value={form.handle}
        onChangeText={set('handle')}
        autoCapitalize="none"
        autoComplete="username"
        hint={t('auth.register.handleHint')}
        error={fieldError('handle')}
      />
      <TextField
        label={t('auth.register.email')}
        value={form.email}
        onChangeText={set('email')}
        inputMode="email"
        autoCapitalize="none"
        autoComplete="email"
        error={fieldError('email')}
      />
      <TextField
        label={t('auth.register.password')}
        value={form.password}
        onChangeText={set('password')}
        secureTextEntry
        autoComplete="new-password"
        hint={t('auth.register.passwordHint')}
        error={fieldError('password')}
      />

      {/* Aviso de privacidad simplificado (LFPDPPP) antes de recabar el consentimiento. */}
      <Paragraph size="$2" color="$color10">
        {t('auth.privacy.shortNotice', { contact: PRIVACY_CONTACT, url: privacyHref })}{' '}
        <Link href={privacyHref}>{t('auth.register.privacyLink')}</Link>
      </Paragraph>
      <CheckboxField
        checked={form.acceptPrivacyNotice}
        onCheckedChange={set('acceptPrivacyNotice')}
        label={t('auth.register.acceptPrivacy')}
        error={fieldError('acceptPrivacyNotice')}
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

'use client';

import {
  apiFormErrors,
  type FormErrors,
  NO_ERRORS,
  useAuth,
  validationErrors,
} from '@sentio/api-client';
import { loginSchema } from '@sentio/core';
import { useDynamicT, useTranslation } from '@sentio/i18n';
import { AuthScreen, Button, FormMessage, Paragraph, TextField, XStack } from '@sentio/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function LoginPage() {
  const { t } = useTranslation();
  const tr = useDynamicT();
  const { login } = useAuth();
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>(NO_ERRORS);
  const [submitting, setSubmitting] = useState(false);

  const fieldError = (name: string) => tr(errors.fields[name]);

  async function onSubmit() {
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(validationErrors(parsed.error.issues));
      return;
    }
    setErrors(NO_ERRORS);
    setSubmitting(true);
    try {
      await login(parsed.data);
      router.replace(`/${locale}`);
    } catch (error) {
      setErrors(apiFormErrors(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      footer={
        <>
          <XStack gap="$2" alignItems="center">
            <Paragraph>{t('auth.login.noAccount')}</Paragraph>
            <Link href={`/${locale}/register`}>{t('auth.login.goRegister')}</Link>
          </XStack>
          <LanguageSwitcher path="login" />
        </>
      }
    >
      <FormMessage>{tr(errors.form)}</FormMessage>
      <TextField
        label={t('auth.login.email')}
        value={email}
        onChangeText={setEmail}
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        error={fieldError('email')}
      />
      <TextField
        label={t('auth.login.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        onSubmitEditing={() => void onSubmit()}
        error={fieldError('password')}
      />
      <Button loading={submitting} onPress={() => void onSubmit()}>
        {t('auth.login.submit')}
      </Button>
    </AuthScreen>
  );
}

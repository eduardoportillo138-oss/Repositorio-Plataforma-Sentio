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
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';

export default function LoginScreen() {
  const { t } = useTranslation();
  const tr = useDynamicT();
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>(NO_ERRORS);
  const [submitting, setSubmitting] = useState(false);

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
      router.replace('/');
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
        <XStack gap="$2" alignItems="center">
          <Paragraph>{t('auth.login.noAccount')}</Paragraph>
          <Link href="/register">
            <Paragraph color="$blue10">{t('auth.login.goRegister')}</Paragraph>
          </Link>
        </XStack>
      }
    >
      <FormMessage>{tr(errors.form)}</FormMessage>
      <TextField
        label={t('auth.login.email')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        error={tr(errors.fields.email)}
      />
      <TextField
        label={t('auth.login.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={() => void onSubmit()}
        error={tr(errors.fields.password)}
      />
      <Button loading={submitting} onPress={() => void onSubmit()}>
        {t('auth.login.submit')}
      </Button>
    </AuthScreen>
  );
}

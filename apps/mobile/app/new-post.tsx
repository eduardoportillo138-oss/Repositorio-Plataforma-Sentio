import { POST_TEXT_MAX_LENGTH, useAuth, useCreatePostForm } from '@sentio/api-client';
import { useDynamicT, useTranslation } from '@sentio/i18n';
import { PageContainer, PostComposer } from '@sentio/ui';
import { Redirect, useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ScreenHeader';

/** "Nueva publicación" como pantalla modal sobre el portal. */
export default function NewPostScreen() {
  const { t } = useTranslation();
  const tr = useDynamicT();
  const router = useRouter();
  const { status } = useAuth();
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const form = useCreatePostForm(close);

  if (status === 'anonymous') return <Redirect href="/login" />;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <ScreenHeader title={t('post.newPost')} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <PageContainer>
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
            onCancel={close}
          />
        </PageContainer>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

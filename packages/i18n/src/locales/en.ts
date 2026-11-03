import { type Messages } from './es';

export const en: Messages = {
  common: {
    appName: 'Sentio',
    loading: 'Loading…',
    or: 'or',
    language: 'Language',
  },
  languages: {
    es: 'Español',
    en: 'English',
  },
  auth: {
    login: {
      title: 'Sign in',
      subtitle: 'Good to see you again.',
      email: 'Email',
      password: 'Password',
      submit: 'Sign in',
      noAccount: "Don't have an account yet?",
      goRegister: 'Sign up',
    },
    register: {
      title: 'Create your account',
      subtitle: 'Join your groups and communities.',
      displayName: 'Name',
      handle: 'Username',
      handleHint: '3 to 30 characters: lowercase letters, numbers and underscores.',
      email: 'Email',
      password: 'Password',
      passwordHint: 'At least 8 characters, including a letter and a number.',
      acceptPrivacy: 'I have read and accept the Privacy Notice.',
      privacyLink: 'Read the Privacy Notice',
      marketingOptIn:
        'Send me news and promotions from Sentio (optional; you can withdraw at any time).',
      submit: 'Create account',
      haveAccount: 'Already have an account?',
      goLogin: 'Sign in',
    },
    privacy: {
      shortNotice:
        'Sentio is responsible for processing your personal data. We use it to create and manage ' +
        'your account, show you content from the people and groups you follow, and keep the service ' +
        'secure (primary purposes). With your consent, we also use it to send you news and ' +
        'promotions (secondary purpose). You can exercise your ARCO rights and withdraw your consent ' +
        'by writing to {{contact}}. Read the full Privacy Notice at {{url}}.',
    },
    home: {
      greeting: 'Hi, {{name}}',
      signedInAs: 'Signed in as @{{handle}}',
      logout: 'Sign out',
    },
  },
  errors: {
    UNAUTHENTICATED: 'Your session expired. Please sign in again.',
    INVALID_CREDENTIALS: 'Incorrect email or password.',
    CONFLICT: 'That value is already in use.',
    CONFLICT_email: 'An account with this email already exists.',
    CONFLICT_handle: 'This username is not available.',
    RATE_LIMITED: 'Too many attempts. Wait a moment and try again.',
    BAD_USER_INPUT: 'Please check the form.',
    FORBIDDEN: "You don't have permission to do this.",
    FORBIDDEN_GROUP: "You don't have access to this group.",
    REFRESH_TOKEN_REUSED: 'We signed you out for security. Please sign in again.',
    network: "We couldn't reach the server. Check your connection.",
    unknown: 'Something went wrong. Please try again.',
  },
  validation: {
    email: { invalid: 'Enter a valid email.' },
    password: {
      required: 'Enter your password.',
      min: 'Must be at least 8 characters.',
      max: 'It is too long.',
      letter: 'Must include at least one letter.',
      digit: 'Must include at least one number.',
    },
    handle: { format: 'Use 3 to 30 lowercase letters, numbers or underscores.' },
    displayName: { required: 'Enter your name.', max: '60 characters max.' },
    bio: { max: '280 characters max.' },
    url: { invalid: 'Enter a valid URL.' },
    privacy: { required: 'You must accept the Privacy Notice to create an account.' },
  },
};

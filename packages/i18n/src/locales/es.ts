/** Español (idioma por defecto). Es la fuente de verdad de las claves. */
export const es = {
  common: {
    appName: 'Sentio',
    loading: 'Cargando…',
    or: 'o',
    language: 'Idioma',
  },
  languages: {
    es: 'Español',
    en: 'English',
  },
  auth: {
    login: {
      title: 'Inicia sesión',
      subtitle: 'Qué bueno verte de nuevo.',
      email: 'Correo electrónico',
      password: 'Contraseña',
      submit: 'Entrar',
      noAccount: '¿Aún no tienes cuenta?',
      goRegister: 'Regístrate',
    },
    register: {
      title: 'Crea tu cuenta',
      subtitle: 'Únete a tus grupos y comunidades.',
      displayName: 'Nombre',
      handle: 'Nombre de usuario',
      handleHint: 'De 3 a 30 caracteres: letras minúsculas, números y guion bajo.',
      email: 'Correo electrónico',
      password: 'Contraseña',
      passwordHint: 'Mínimo 8 caracteres, con al menos una letra y un número.',
      acceptPrivacy: 'He leído y acepto el Aviso de Privacidad.',
      privacyLink: 'Leer el Aviso de Privacidad',
      marketingOptIn:
        'Acepto recibir novedades y promociones de Sentio (opcional; puedes retirarlo cuando quieras).',
      submit: 'Crear cuenta',
      haveAccount: '¿Ya tienes cuenta?',
      goLogin: 'Inicia sesión',
    },
    privacy: {
      // Aviso de privacidad simplificado (LFPDPPP, art. 15–17). BORRADOR: debe revisarlo un abogado.
      shortNotice:
        'Sentio es responsable del tratamiento de tus datos personales. Los usamos para crear y ' +
        'administrar tu cuenta, mostrarte contenido de las personas y grupos que sigues y mantener la ' +
        'seguridad del servicio (finalidades primarias). Con tu consentimiento, también para enviarte ' +
        'novedades y promociones (finalidad secundaria). Puedes ejercer tus derechos ARCO y revocar tu ' +
        'consentimiento escribiendo a {{contact}}. Consulta el Aviso de Privacidad integral en {{url}}.',
    },
  },
  portal: {
    nav: {
      label: 'Navegación principal',
      home: 'Inicio',
      search: 'Búsqueda',
      profile: 'Perfil',
    },
    logout: 'Cerrar sesión',
    home: {
      empty: {
        title: 'Hola, {{name}}',
        body: 'Aquí verás las publicaciones de la comunidad. Por ahora no hay nada que mostrar.',
      },
    },
    search: {
      empty: {
        title: 'Búsqueda',
        body: 'Pronto podrás buscar personas y publicaciones.',
      },
    },
    profile: {
      empty: {
        title: '@{{handle}}',
        body: 'Aquí podrás editar tu foto, tu biografía y tus etiquetas.',
      },
    },
  },
  errors: {
    UNAUTHENTICATED: 'Tu sesión expiró. Inicia sesión de nuevo.',
    INVALID_CREDENTIALS: 'Correo o contraseña incorrectos.',
    CONFLICT: 'Ese dato ya está en uso.',
    CONFLICT_email: 'Ya existe una cuenta con este correo.',
    CONFLICT_handle: 'Este nombre de usuario no está disponible.',
    RATE_LIMITED: 'Demasiados intentos. Espera un momento y vuelve a intentarlo.',
    BAD_USER_INPUT: 'Revisa los datos del formulario.',
    FORBIDDEN: 'No tienes permiso para hacer esto.',
    FORBIDDEN_GROUP: 'No tienes acceso a este grupo.',
    REFRESH_TOKEN_REUSED: 'Cerramos tu sesión por seguridad. Inicia sesión de nuevo.',
    network: 'No pudimos conectar con el servidor. Revisa tu conexión.',
    unknown: 'Algo salió mal. Inténtalo de nuevo.',
  },
  validation: {
    email: { invalid: 'Escribe un correo válido.' },
    password: {
      required: 'Escribe tu contraseña.',
      min: 'Debe tener al menos 8 caracteres.',
      max: 'Es demasiado larga.',
      letter: 'Debe incluir al menos una letra.',
      digit: 'Debe incluir al menos un número.',
    },
    handle: { format: 'Usa de 3 a 30 letras minúsculas, números o guion bajo.' },
    displayName: { required: 'Escribe tu nombre.', max: 'Máximo 60 caracteres.' },
    bio: { max: 'Máximo 280 caracteres.' },
    url: { invalid: 'Escribe una URL válida.' },
    privacy: { required: 'Debes aceptar el Aviso de Privacidad para crear tu cuenta.' },
  },
} as const;

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };

/** Forma que debe cumplir cada idioma (mismas claves que `es`). */
export type Messages = Widen<typeof es>;

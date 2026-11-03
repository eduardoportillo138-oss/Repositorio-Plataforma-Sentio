import { parseApiError } from './errors';

/** Errores de formulario expresados como claves de traducción de @sentio/i18n. */
export interface FormErrors {
  form: string | null;
  fields: Record<string, string>;
}

export const NO_ERRORS: FormErrors = { form: null, fields: {} };

/** A partir de los issues de un `safeParse` de zod (sus mensajes ya son claves de i18n). */
export function validationErrors(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): FormErrors {
  const fields: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join('.');
    fields[key] ??= issue.message;
  }
  return { form: null, fields };
}

/** A partir de un error de la API (códigos de extensión). */
export function apiFormErrors(error: unknown): FormErrors {
  const info = parseApiError(error);

  if (info.code === 'BAD_USER_INPUT' && info.fieldErrors) {
    const fields: Record<string, string> = {};
    for (const [field, messages] of Object.entries(info.fieldErrors)) {
      if (messages[0]) fields[field] = messages[0];
    }
    return { form: 'errors.BAD_USER_INPUT', fields };
  }
  if (info.code === 'CONFLICT' && (info.field === 'email' || info.field === 'handle')) {
    return { form: null, fields: { [info.field]: `errors.CONFLICT_${info.field}` } };
  }
  if (info.code === 'NETWORK') return { form: 'errors.network', fields: {} };

  const known = [
    'UNAUTHENTICATED',
    'INVALID_CREDENTIALS',
    'RATE_LIMITED',
    'FORBIDDEN',
    'FORBIDDEN_GROUP',
    'REFRESH_TOKEN_REUSED',
    'CONFLICT',
  ];
  return { form: known.includes(info.code) ? `errors.${info.code}` : 'errors.unknown', fields: {} };
}

'use client';

import {
  BIO_MAX_LENGTH,
  MAX_PROFILE_TAGS,
  privateContactSchema,
  updateProfileSchema,
} from '@sentio/core';
import { useCallback, useEffect, useState } from 'react';
import { apiFormErrors, type FormErrors, NO_ERRORS, validationErrors } from './form-errors';
import {
  type PrivateContactFieldsFragment,
  useMeQuery,
  useProfileQualitiesQuery,
  useUpdatePrivateContactMutation,
  useUpdateProfileMutation,
} from './generated/graphql';

export { BIO_MAX_LENGTH, MAX_PROFILE_TAGS };

/** Estado del formulario "Editar perfil" (nombre, biografía y cualidades), igual en web y móvil. */
export function useEditProfileForm() {
  const me = useMeQuery({ fetchPolicy: 'cache-and-network' });
  const qualities = useProfileQualitiesQuery({ fetchPolicy: 'cache-first' });
  const [mutate, { loading: saving }] = useUpdateProfileMutation();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>(NO_ERRORS);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const viewer = me.data?.me;
  useEffect(() => {
    if (!viewer || loaded) return;
    setDisplayName(viewer.displayName);
    setBio(viewer.bio ?? '');
    setTags(viewer.tags);
    setLoaded(true);
  }, [viewer, loaded]);

  const save = useCallback(async (): Promise<boolean> => {
    setSaved(false);
    const parsed = updateProfileSchema.safeParse({
      displayName,
      bio: bio.trim() === '' ? null : bio,
      tags,
    });
    if (!parsed.success) {
      setErrors(validationErrors(parsed.error.issues));
      return false;
    }
    setErrors(NO_ERRORS);
    try {
      await mutate({ variables: { input: parsed.data } });
      setSaved(true);
      return true;
    } catch (error) {
      setErrors(apiFormErrors(error));
      return false;
    }
  }, [displayName, bio, tags, mutate]);

  /** Normaliza claves de error de arreglos (tags.0 → tags). */
  const fieldError = (name: string): string | null =>
    errors.fields[name] ??
    Object.entries(errors.fields).find(([k]) => k.startsWith(`${name}.`))?.[1] ??
    null;

  return {
    viewer,
    loading: !loaded && me.loading,
    qualityKeys: qualities.data?.profileQualities.map((q) => q.key) ?? [],
    displayName,
    setDisplayName,
    bio,
    setBio,
    tags,
    setTags,
    errors,
    fieldError,
    saving,
    saved,
    save,
  };
}

type ContactField = Exclude<keyof PrivateContactFieldsFragment, '__typename'>;

export const PRIVATE_CONTACT_FIELDS: readonly ContactField[] = [
  'phone',
  'altEmail',
  'institution',
  'studentId',
  'emergencyContactName',
  'emergencyContactPhone',
];

const EMPTY_CONTACT: Record<ContactField, string> = {
  phone: '',
  altEmail: '',
  institution: '',
  studentId: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
};

/** Estado del formulario "Información privada". */
export function usePrivateContactForm() {
  const me = useMeQuery({ fetchPolicy: 'cache-and-network' });
  const [mutate, { loading: saving }] = useUpdatePrivateContactMutation();
  const [values, setValues] = useState<Record<ContactField, string>>(EMPTY_CONTACT);
  const [errors, setErrors] = useState<FormErrors>(NO_ERRORS);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const contact = me.data?.me.privateContact;
  useEffect(() => {
    if (loaded || !me.data) return;
    const next = { ...EMPTY_CONTACT };
    for (const f of PRIVATE_CONTACT_FIELDS) next[f] = contact?.[f] ?? '';
    setValues(next);
    setLoaded(true);
  }, [contact, me.data, loaded]);

  const setField = useCallback((field: ContactField, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    setSaved(false);
    const parsed = privateContactSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(validationErrors(parsed.error.issues));
      return false;
    }
    setErrors(NO_ERRORS);
    try {
      await mutate({ variables: { input: parsed.data } });
      setSaved(true);
      return true;
    } catch (error) {
      setErrors(apiFormErrors(error));
      return false;
    }
  }, [values, mutate]);

  return {
    loading: !loaded && me.loading,
    values,
    setField,
    errors,
    saving,
    saved,
    save,
  };
}

/* eslint-disable */
// Archivo generado por @sentio/graphql. No editar.
import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: string; output: string; }
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  /** JWT de acceso (15 min). Enviar como Authorization: Bearer <token>. */
  accessToken: Scalars['String']['output'];
  accessTokenExpiresAt: Scalars['DateTime']['output'];
  /** Refresh token opaco (30 días, rotativo). Es null para clientes web (header x-client: web), que lo reciben en una cookie httpOnly. */
  refreshToken: Maybe<Scalars['String']['output']>;
  refreshTokenExpiresAt: Scalars['DateTime']['output'];
  user: User;
};

/** Foto de perfil procesada (WebP sin metadatos). */
export type Avatar = {
  __typename?: 'Avatar';
  assetId: Scalars['ID']['output'];
  /** Marcador de carga (https://blurha.sh). */
  blurhash: Scalars['String']['output'];
  /** Variante cuadrada de 256 px. */
  url256: Scalars['String']['output'];
  /** Variante cuadrada de 512 px. */
  url512: Scalars['String']['output'];
};

/** Datos para subir el archivo con un PUT directo al almacenamiento. */
export type AvatarUploadTicket = {
  __typename?: 'AvatarUploadTicket';
  assetId: Scalars['ID']['output'];
  expiresAt: Scalars['DateTime']['output'];
  /** Encabezados obligatorios del PUT. */
  headers: Array<UploadHeader>;
  /** URL prefirmada (PUT). Vence en 10 minutos. */
  uploadUrl: Scalars['String']['output'];
};

/** Consentimientos del titular (solo visibles para él). */
export type Consents = {
  __typename?: 'Consents';
  marketingOptIn: Scalars['Boolean']['output'];
  marketingOptInUpdatedAt: Scalars['DateTime']['output'];
  privacyNoticeAcceptedAt: Scalars['DateTime']['output'];
  privacyNoticeVersion: Scalars['String']['output'];
};

export type CreateGroupInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  /** Si se omite: INVITE_ONLY para SECRET, REQUEST para PRIVATE y OPEN para PUBLIC. Un grupo SECRET solo admite INVITE_ONLY. */
  joinPolicy?: InputMaybe<JoinPolicy>;
  name: Scalars['String']['input'];
  visibility?: InputMaybe<GroupVisibility>;
};

export type Group = {
  __typename?: 'Group';
  createdAt: Scalars['DateTime']['output'];
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  joinPolicy: JoinPolicy;
  memberCount: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
  /** Membresía del usuario actual. */
  viewerMembership: Maybe<GroupMember>;
  visibility: GroupVisibility;
};

export type GroupMember = {
  __typename?: 'GroupMember';
  groupId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  joinedAt: Maybe<Scalars['DateTime']['output']>;
  role: GroupRole;
  status: MembershipStatus;
  user: Maybe<User>;
  userId: Scalars['ID']['output'];
};

export type GroupMemberConnection = {
  __typename?: 'GroupMemberConnection';
  edges: Array<GroupMemberEdge>;
  pageInfo: PageInfo;
};

export type GroupMemberEdge = {
  __typename?: 'GroupMemberEdge';
  cursor: Scalars['String']['output'];
  node: GroupMember;
};

export type GroupRole =
  | 'ADMIN'
  | 'MEMBER'
  | 'MODERATOR'
  | 'OWNER';

export type GroupVisibility =
  /** Cualquiera lo encuentra; solo los miembros ven el contenido. */
  | 'PRIVATE'
  /** Cualquiera lo encuentra y ve su contenido. */
  | 'PUBLIC'
  /** Solo los miembros saben que existe. Solo por invitación. */
  | 'SECRET';

export type JoinPolicy =
  | 'INVITE_ONLY'
  | 'OPEN'
  | 'REQUEST';

export type LoginInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type MediaAsset = {
  __typename?: 'MediaAsset';
  /** Variantes procesadas, cuando status = ready y purpose = avatar. */
  avatar: Maybe<Avatar>;
  id: Scalars['ID']['output'];
  kind: Scalars['String']['output'];
  purpose: Scalars['String']['output'];
  status: MediaStatus;
};

export type MediaStatus =
  | 'failed'
  | 'pending'
  | 'processing'
  | 'ready';

export type MembershipStatus =
  | 'ACTIVE'
  | 'BANNED'
  | 'PENDING';

export type Mutation = {
  __typename?: 'Mutation';
  /** Paso 2: confirma la subida y la manda a procesar. Si las colas están activas el resultado llega por Socket.IO (media:ready); si no, se devuelve ya procesado. */
  confirmAvatarUpload: MediaAsset;
  createGroup: Group;
  login: AuthPayload;
  /** Cierra la sesión actual o todas (allDevices). */
  logout: Scalars['Boolean']['output'];
  /** Canjea un refresh token por un par nuevo. Si se omite `token`, se lee de la cookie. */
  refreshToken: AuthPayload;
  register: AuthPayload;
  /** Quita la foto de perfil. */
  removeAvatar: User;
  /** Paso 1 de la foto de perfil: JPEG, PNG, WebP o HEIC de hasta 5 MB. Devuelve una URL prefirmada (PUT) válida 10 minutos. */
  requestAvatarUpload: AvatarUploadTicket;
  /** Otorga o revoca el consentimiento para finalidades secundarias (marketing). */
  updateMarketingConsent: User;
  /** Actualiza los datos de contacto privados. */
  updatePrivateContact: User;
  /** Actualiza nombre, biografía y cualidades. */
  updateProfile: User;
};


export type MutationConfirmAvatarUploadArgs = {
  assetId: Scalars['ID']['input'];
};


export type MutationCreateGroupArgs = {
  input: CreateGroupInput;
};


export type MutationLoginArgs = {
  input: LoginInput;
};


export type MutationLogoutArgs = {
  allDevices?: Scalars['Boolean']['input'];
};


export type MutationRefreshTokenArgs = {
  token?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRegisterArgs = {
  input: RegisterInput;
};


export type MutationRequestAvatarUploadArgs = {
  mimeType: Scalars['String']['input'];
  sizeBytes: Scalars['Int']['input'];
};


export type MutationUpdateMarketingConsentArgs = {
  optIn: Scalars['Boolean']['input'];
};


export type MutationUpdatePrivateContactArgs = {
  input: UpdatePrivateContactInput;
};


export type MutationUpdateProfileArgs = {
  input: UpdateProfileInput;
};

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor: Maybe<Scalars['String']['output']>;
};

/** Datos de contacto privados del estudiante. */
export type PrivateContact = {
  __typename?: 'PrivateContact';
  altEmail: Maybe<Scalars['String']['output']>;
  emergencyContactName: Maybe<Scalars['String']['output']>;
  emergencyContactPhone: Maybe<Scalars['String']['output']>;
  institution: Maybe<Scalars['String']['output']>;
  phone: Maybe<Scalars['String']['output']>;
  studentId: Maybe<Scalars['String']['output']>;
};

/** Cualidad del catálogo. El texto visible se traduce en el cliente con su clave. */
export type ProfileQuality = {
  __typename?: 'ProfileQuality';
  key: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  /** Devuelve null si el grupo no existe o el usuario no puede verlo (sin distinguir los casos, para no revelar la existencia de grupos privados). */
  group: Maybe<Group>;
  groupMembers: GroupMemberConnection;
  /** Usuario autenticado. */
  me: User;
  /** Catálogo de cualidades para las etiquetas del perfil (el cliente las traduce). */
  profileQualities: Array<ProfileQuality>;
  /** Perfil público por handle. */
  user: Maybe<User>;
};


export type QueryGroupArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGroupMembersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  groupId: Scalars['ID']['input'];
};


export type QueryUserArgs = {
  handle: Scalars['String']['input'];
};

export type RegisterInput = {
  /** Aceptación expresa del Aviso de Privacidad vigente (LFPDPPP). Debe ser true. */
  acceptPrivacyNotice: Scalars['Boolean']['input'];
  displayName: Scalars['String']['input'];
  email: Scalars['String']['input'];
  handle: Scalars['String']['input'];
  /** Idioma preferido: es (por defecto) o en. */
  locale?: InputMaybe<Scalars['String']['input']>;
  /** Consentimiento opcional para finalidades secundarias. */
  marketingOptIn?: InputMaybe<Scalars['Boolean']['input']>;
  password: Scalars['String']['input'];
};

export type UpdatePrivateContactInput = {
  altEmail?: InputMaybe<Scalars['String']['input']>;
  emergencyContactName?: InputMaybe<Scalars['String']['input']>;
  /** Formato E.164. */
  emergencyContactPhone?: InputMaybe<Scalars['String']['input']>;
  institution?: InputMaybe<Scalars['String']['input']>;
  /** Formato E.164, p. ej. +525512345678. */
  phone?: InputMaybe<Scalars['String']['input']>;
  studentId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateProfileInput = {
  /** Hasta 300 caracteres; null la borra. */
  bio?: InputMaybe<Scalars['String']['input']>;
  displayName?: InputMaybe<Scalars['String']['input']>;
  /** Hasta 3 claves de profileQualities, sin repetir. */
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type UploadHeader = {
  __typename?: 'UploadHeader';
  name: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type User = {
  __typename?: 'User';
  avatar: Maybe<Avatar>;
  bio: Maybe<Scalars['String']['output']>;
  /** Solo visible para el propio usuario. */
  consents: Maybe<Consents>;
  createdAt: Scalars['DateTime']['output'];
  displayName: Scalars['String']['output'];
  /** Solo visible para el propio usuario. */
  email: Maybe<Scalars['String']['output']>;
  handle: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** Solo visible para el propio usuario; para cualquier otro es null. */
  privateContact: Maybe<PrivateContact>;
  /** Claves de cualidades (máximo 3). */
  tags: Array<Scalars['String']['output']>;
};

export type ViewerFieldsFragment = { __typename?: 'User', email: string | null, createdAt: string, id: string, handle: string, displayName: string, bio: string | null, tags: Array<string>, consents: { __typename?: 'Consents', privacyNoticeVersion: string, privacyNoticeAcceptedAt: string, marketingOptIn: boolean } | null, privateContact: { __typename?: 'PrivateContact', phone: string | null, altEmail: string | null, institution: string | null, studentId: string | null, emergencyContactName: string | null, emergencyContactPhone: string | null } | null, avatar: { __typename?: 'Avatar', assetId: string, url256: string, url512: string, blurhash: string } | null };

export type AuthPayloadFieldsFragment = { __typename?: 'AuthPayload', accessToken: string, accessTokenExpiresAt: string, refreshToken: string | null, refreshTokenExpiresAt: string, user: { __typename?: 'User', email: string | null, createdAt: string, id: string, handle: string, displayName: string, bio: string | null, tags: Array<string>, consents: { __typename?: 'Consents', privacyNoticeVersion: string, privacyNoticeAcceptedAt: string, marketingOptIn: boolean } | null, privateContact: { __typename?: 'PrivateContact', phone: string | null, altEmail: string | null, institution: string | null, studentId: string | null, emergencyContactName: string | null, emergencyContactPhone: string | null } | null, avatar: { __typename?: 'Avatar', assetId: string, url256: string, url512: string, blurhash: string } | null } };

export type RegisterMutationVariables = Exact<{
  input: RegisterInput;
}>;


export type RegisterMutation = { __typename?: 'Mutation', register: { __typename?: 'AuthPayload', accessToken: string, accessTokenExpiresAt: string, refreshToken: string | null, refreshTokenExpiresAt: string, user: { __typename?: 'User', email: string | null, createdAt: string, id: string, handle: string, displayName: string, bio: string | null, tags: Array<string>, consents: { __typename?: 'Consents', privacyNoticeVersion: string, privacyNoticeAcceptedAt: string, marketingOptIn: boolean } | null, privateContact: { __typename?: 'PrivateContact', phone: string | null, altEmail: string | null, institution: string | null, studentId: string | null, emergencyContactName: string | null, emergencyContactPhone: string | null } | null, avatar: { __typename?: 'Avatar', assetId: string, url256: string, url512: string, blurhash: string } | null } } };

export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'AuthPayload', accessToken: string, accessTokenExpiresAt: string, refreshToken: string | null, refreshTokenExpiresAt: string, user: { __typename?: 'User', email: string | null, createdAt: string, id: string, handle: string, displayName: string, bio: string | null, tags: Array<string>, consents: { __typename?: 'Consents', privacyNoticeVersion: string, privacyNoticeAcceptedAt: string, marketingOptIn: boolean } | null, privateContact: { __typename?: 'PrivateContact', phone: string | null, altEmail: string | null, institution: string | null, studentId: string | null, emergencyContactName: string | null, emergencyContactPhone: string | null } | null, avatar: { __typename?: 'Avatar', assetId: string, url256: string, url512: string, blurhash: string } | null } } };

export type RefreshTokenMutationVariables = Exact<{
  token?: InputMaybe<Scalars['String']['input']>;
}>;


export type RefreshTokenMutation = { __typename?: 'Mutation', refreshToken: { __typename?: 'AuthPayload', accessToken: string, accessTokenExpiresAt: string, refreshToken: string | null, refreshTokenExpiresAt: string, user: { __typename?: 'User', email: string | null, createdAt: string, id: string, handle: string, displayName: string, bio: string | null, tags: Array<string>, consents: { __typename?: 'Consents', privacyNoticeVersion: string, privacyNoticeAcceptedAt: string, marketingOptIn: boolean } | null, privateContact: { __typename?: 'PrivateContact', phone: string | null, altEmail: string | null, institution: string | null, studentId: string | null, emergencyContactName: string | null, emergencyContactPhone: string | null } | null, avatar: { __typename?: 'Avatar', assetId: string, url256: string, url512: string, blurhash: string } | null } } };

export type LogoutMutationVariables = Exact<{
  allDevices?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type LogoutMutation = { __typename?: 'Mutation', logout: boolean };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me: { __typename?: 'User', email: string | null, createdAt: string, id: string, handle: string, displayName: string, bio: string | null, tags: Array<string>, consents: { __typename?: 'Consents', privacyNoticeVersion: string, privacyNoticeAcceptedAt: string, marketingOptIn: boolean } | null, privateContact: { __typename?: 'PrivateContact', phone: string | null, altEmail: string | null, institution: string | null, studentId: string | null, emergencyContactName: string | null, emergencyContactPhone: string | null } | null, avatar: { __typename?: 'Avatar', assetId: string, url256: string, url512: string, blurhash: string } | null } };

export type RequestAvatarUploadMutationVariables = Exact<{
  mimeType: Scalars['String']['input'];
  sizeBytes: Scalars['Int']['input'];
}>;


export type RequestAvatarUploadMutation = { __typename?: 'Mutation', requestAvatarUpload: { __typename?: 'AvatarUploadTicket', assetId: string, uploadUrl: string, expiresAt: string, headers: Array<{ __typename?: 'UploadHeader', name: string, value: string }> } };

export type ConfirmAvatarUploadMutationVariables = Exact<{
  assetId: Scalars['ID']['input'];
}>;


export type ConfirmAvatarUploadMutation = { __typename?: 'Mutation', confirmAvatarUpload: { __typename?: 'MediaAsset', id: string, status: MediaStatus, avatar: { __typename?: 'Avatar', assetId: string, url256: string, url512: string, blurhash: string } | null } };

export type RemoveAvatarMutationVariables = Exact<{ [key: string]: never; }>;


export type RemoveAvatarMutation = { __typename?: 'Mutation', removeAvatar: { __typename?: 'User', email: string | null, createdAt: string, id: string, handle: string, displayName: string, bio: string | null, tags: Array<string>, consents: { __typename?: 'Consents', privacyNoticeVersion: string, privacyNoticeAcceptedAt: string, marketingOptIn: boolean } | null, privateContact: { __typename?: 'PrivateContact', phone: string | null, altEmail: string | null, institution: string | null, studentId: string | null, emergencyContactName: string | null, emergencyContactPhone: string | null } | null, avatar: { __typename?: 'Avatar', assetId: string, url256: string, url512: string, blurhash: string } | null } };

export type AvatarFieldsFragment = { __typename?: 'Avatar', assetId: string, url256: string, url512: string, blurhash: string };

export type PublicUserFieldsFragment = { __typename?: 'User', id: string, handle: string, displayName: string, bio: string | null, tags: Array<string>, avatar: { __typename?: 'Avatar', assetId: string, url256: string, url512: string, blurhash: string } | null };

export type PrivateContactFieldsFragment = { __typename?: 'PrivateContact', phone: string | null, altEmail: string | null, institution: string | null, studentId: string | null, emergencyContactName: string | null, emergencyContactPhone: string | null };

export type UserProfileQueryVariables = Exact<{
  handle: Scalars['String']['input'];
}>;


export type UserProfileQuery = { __typename?: 'Query', user: { __typename?: 'User', id: string, handle: string, displayName: string, bio: string | null, tags: Array<string>, avatar: { __typename?: 'Avatar', assetId: string, url256: string, url512: string, blurhash: string } | null } | null };

export type ProfileQualitiesQueryVariables = Exact<{ [key: string]: never; }>;


export type ProfileQualitiesQuery = { __typename?: 'Query', profileQualities: Array<{ __typename?: 'ProfileQuality', key: string }> };

export type UpdateProfileMutationVariables = Exact<{
  input: UpdateProfileInput;
}>;


export type UpdateProfileMutation = { __typename?: 'Mutation', updateProfile: { __typename?: 'User', email: string | null, createdAt: string, id: string, handle: string, displayName: string, bio: string | null, tags: Array<string>, consents: { __typename?: 'Consents', privacyNoticeVersion: string, privacyNoticeAcceptedAt: string, marketingOptIn: boolean } | null, privateContact: { __typename?: 'PrivateContact', phone: string | null, altEmail: string | null, institution: string | null, studentId: string | null, emergencyContactName: string | null, emergencyContactPhone: string | null } | null, avatar: { __typename?: 'Avatar', assetId: string, url256: string, url512: string, blurhash: string } | null } };

export type UpdatePrivateContactMutationVariables = Exact<{
  input: UpdatePrivateContactInput;
}>;


export type UpdatePrivateContactMutation = { __typename?: 'Mutation', updatePrivateContact: { __typename?: 'User', email: string | null, createdAt: string, id: string, handle: string, displayName: string, bio: string | null, tags: Array<string>, consents: { __typename?: 'Consents', privacyNoticeVersion: string, privacyNoticeAcceptedAt: string, marketingOptIn: boolean } | null, privateContact: { __typename?: 'PrivateContact', phone: string | null, altEmail: string | null, institution: string | null, studentId: string | null, emergencyContactName: string | null, emergencyContactPhone: string | null } | null, avatar: { __typename?: 'Avatar', assetId: string, url256: string, url512: string, blurhash: string } | null } };

export const AvatarFieldsFragmentDoc = gql`
    fragment AvatarFields on Avatar {
  assetId
  url256
  url512
  blurhash
}
    `;
export const PublicUserFieldsFragmentDoc = gql`
    fragment PublicUserFields on User {
  id
  handle
  displayName
  bio
  tags
  avatar {
    ...AvatarFields
  }
}
    ${AvatarFieldsFragmentDoc}`;
export const PrivateContactFieldsFragmentDoc = gql`
    fragment PrivateContactFields on PrivateContact {
  phone
  altEmail
  institution
  studentId
  emergencyContactName
  emergencyContactPhone
}
    `;
export const ViewerFieldsFragmentDoc = gql`
    fragment ViewerFields on User {
  ...PublicUserFields
  email
  createdAt
  consents {
    privacyNoticeVersion
    privacyNoticeAcceptedAt
    marketingOptIn
  }
  privateContact {
    ...PrivateContactFields
  }
}
    ${PublicUserFieldsFragmentDoc}
${PrivateContactFieldsFragmentDoc}`;
export const AuthPayloadFieldsFragmentDoc = gql`
    fragment AuthPayloadFields on AuthPayload {
  accessToken
  accessTokenExpiresAt
  refreshToken
  refreshTokenExpiresAt
  user {
    ...ViewerFields
  }
}
    ${ViewerFieldsFragmentDoc}`;
export const RegisterDocument = gql`
    mutation Register($input: RegisterInput!) {
  register(input: $input) {
    ...AuthPayloadFields
  }
}
    ${AuthPayloadFieldsFragmentDoc}`;
export type RegisterMutationFn = Apollo.MutationFunction<RegisterMutation, RegisterMutationVariables>;

/**
 * __useRegisterMutation__
 *
 * To run a mutation, you first call `useRegisterMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegisterMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [registerMutation, { data, loading, error }] = useRegisterMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRegisterMutation(baseOptions?: Apollo.MutationHookOptions<RegisterMutation, RegisterMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RegisterMutation, RegisterMutationVariables>(RegisterDocument, options);
      }
export type RegisterMutationHookResult = ReturnType<typeof useRegisterMutation>;
export type RegisterMutationResult = Apollo.MutationResult<RegisterMutation>;
export type RegisterMutationOptions = Apollo.BaseMutationOptions<RegisterMutation, RegisterMutationVariables>;
export const LoginDocument = gql`
    mutation Login($input: LoginInput!) {
  login(input: $input) {
    ...AuthPayloadFields
  }
}
    ${AuthPayloadFieldsFragmentDoc}`;
export type LoginMutationFn = Apollo.MutationFunction<LoginMutation, LoginMutationVariables>;

/**
 * __useLoginMutation__
 *
 * To run a mutation, you first call `useLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginMutation, { data, loading, error }] = useLoginMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useLoginMutation(baseOptions?: Apollo.MutationHookOptions<LoginMutation, LoginMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LoginMutation, LoginMutationVariables>(LoginDocument, options);
      }
export type LoginMutationHookResult = ReturnType<typeof useLoginMutation>;
export type LoginMutationResult = Apollo.MutationResult<LoginMutation>;
export type LoginMutationOptions = Apollo.BaseMutationOptions<LoginMutation, LoginMutationVariables>;
export const RefreshTokenDocument = gql`
    mutation RefreshToken($token: String) {
  refreshToken(token: $token) {
    ...AuthPayloadFields
  }
}
    ${AuthPayloadFieldsFragmentDoc}`;
export type RefreshTokenMutationFn = Apollo.MutationFunction<RefreshTokenMutation, RefreshTokenMutationVariables>;

/**
 * __useRefreshTokenMutation__
 *
 * To run a mutation, you first call `useRefreshTokenMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRefreshTokenMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [refreshTokenMutation, { data, loading, error }] = useRefreshTokenMutation({
 *   variables: {
 *      token: // value for 'token'
 *   },
 * });
 */
export function useRefreshTokenMutation(baseOptions?: Apollo.MutationHookOptions<RefreshTokenMutation, RefreshTokenMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RefreshTokenMutation, RefreshTokenMutationVariables>(RefreshTokenDocument, options);
      }
export type RefreshTokenMutationHookResult = ReturnType<typeof useRefreshTokenMutation>;
export type RefreshTokenMutationResult = Apollo.MutationResult<RefreshTokenMutation>;
export type RefreshTokenMutationOptions = Apollo.BaseMutationOptions<RefreshTokenMutation, RefreshTokenMutationVariables>;
export const LogoutDocument = gql`
    mutation Logout($allDevices: Boolean = false) {
  logout(allDevices: $allDevices)
}
    `;
export type LogoutMutationFn = Apollo.MutationFunction<LogoutMutation, LogoutMutationVariables>;

/**
 * __useLogoutMutation__
 *
 * To run a mutation, you first call `useLogoutMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLogoutMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [logoutMutation, { data, loading, error }] = useLogoutMutation({
 *   variables: {
 *      allDevices: // value for 'allDevices'
 *   },
 * });
 */
export function useLogoutMutation(baseOptions?: Apollo.MutationHookOptions<LogoutMutation, LogoutMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LogoutMutation, LogoutMutationVariables>(LogoutDocument, options);
      }
export type LogoutMutationHookResult = ReturnType<typeof useLogoutMutation>;
export type LogoutMutationResult = Apollo.MutationResult<LogoutMutation>;
export type LogoutMutationOptions = Apollo.BaseMutationOptions<LogoutMutation, LogoutMutationVariables>;
export const MeDocument = gql`
    query Me {
  me {
    ...ViewerFields
  }
}
    ${ViewerFieldsFragmentDoc}`;

/**
 * __useMeQuery__
 *
 * To run a query within a React component, call `useMeQuery` and pass it any options that fit your needs.
 * When your component renders, `useMeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMeQuery({
 *   variables: {
 *   },
 * });
 */
export function useMeQuery(baseOptions?: Apollo.QueryHookOptions<MeQuery, MeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MeQuery, MeQueryVariables>(MeDocument, options);
      }
export function useMeLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MeQuery, MeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MeQuery, MeQueryVariables>(MeDocument, options);
        }
// @ts-ignore
export function useMeSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MeQuery, MeQueryVariables>): Apollo.UseSuspenseQueryResult<MeQuery, MeQueryVariables>;
export function useMeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MeQuery, MeQueryVariables>): Apollo.UseSuspenseQueryResult<MeQuery | undefined, MeQueryVariables>;
export function useMeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MeQuery, MeQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MeQuery, MeQueryVariables>(MeDocument, options);
        }
export type MeQueryHookResult = ReturnType<typeof useMeQuery>;
export type MeLazyQueryHookResult = ReturnType<typeof useMeLazyQuery>;
export type MeSuspenseQueryHookResult = ReturnType<typeof useMeSuspenseQuery>;
export type MeQueryResult = Apollo.QueryResult<MeQuery, MeQueryVariables>;
export const RequestAvatarUploadDocument = gql`
    mutation RequestAvatarUpload($mimeType: String!, $sizeBytes: Int!) {
  requestAvatarUpload(mimeType: $mimeType, sizeBytes: $sizeBytes) {
    assetId
    uploadUrl
    expiresAt
    headers {
      name
      value
    }
  }
}
    `;
export type RequestAvatarUploadMutationFn = Apollo.MutationFunction<RequestAvatarUploadMutation, RequestAvatarUploadMutationVariables>;

/**
 * __useRequestAvatarUploadMutation__
 *
 * To run a mutation, you first call `useRequestAvatarUploadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRequestAvatarUploadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [requestAvatarUploadMutation, { data, loading, error }] = useRequestAvatarUploadMutation({
 *   variables: {
 *      mimeType: // value for 'mimeType'
 *      sizeBytes: // value for 'sizeBytes'
 *   },
 * });
 */
export function useRequestAvatarUploadMutation(baseOptions?: Apollo.MutationHookOptions<RequestAvatarUploadMutation, RequestAvatarUploadMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RequestAvatarUploadMutation, RequestAvatarUploadMutationVariables>(RequestAvatarUploadDocument, options);
      }
export type RequestAvatarUploadMutationHookResult = ReturnType<typeof useRequestAvatarUploadMutation>;
export type RequestAvatarUploadMutationResult = Apollo.MutationResult<RequestAvatarUploadMutation>;
export type RequestAvatarUploadMutationOptions = Apollo.BaseMutationOptions<RequestAvatarUploadMutation, RequestAvatarUploadMutationVariables>;
export const ConfirmAvatarUploadDocument = gql`
    mutation ConfirmAvatarUpload($assetId: ID!) {
  confirmAvatarUpload(assetId: $assetId) {
    id
    status
    avatar {
      ...AvatarFields
    }
  }
}
    ${AvatarFieldsFragmentDoc}`;
export type ConfirmAvatarUploadMutationFn = Apollo.MutationFunction<ConfirmAvatarUploadMutation, ConfirmAvatarUploadMutationVariables>;

/**
 * __useConfirmAvatarUploadMutation__
 *
 * To run a mutation, you first call `useConfirmAvatarUploadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useConfirmAvatarUploadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [confirmAvatarUploadMutation, { data, loading, error }] = useConfirmAvatarUploadMutation({
 *   variables: {
 *      assetId: // value for 'assetId'
 *   },
 * });
 */
export function useConfirmAvatarUploadMutation(baseOptions?: Apollo.MutationHookOptions<ConfirmAvatarUploadMutation, ConfirmAvatarUploadMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ConfirmAvatarUploadMutation, ConfirmAvatarUploadMutationVariables>(ConfirmAvatarUploadDocument, options);
      }
export type ConfirmAvatarUploadMutationHookResult = ReturnType<typeof useConfirmAvatarUploadMutation>;
export type ConfirmAvatarUploadMutationResult = Apollo.MutationResult<ConfirmAvatarUploadMutation>;
export type ConfirmAvatarUploadMutationOptions = Apollo.BaseMutationOptions<ConfirmAvatarUploadMutation, ConfirmAvatarUploadMutationVariables>;
export const RemoveAvatarDocument = gql`
    mutation RemoveAvatar {
  removeAvatar {
    ...ViewerFields
  }
}
    ${ViewerFieldsFragmentDoc}`;
export type RemoveAvatarMutationFn = Apollo.MutationFunction<RemoveAvatarMutation, RemoveAvatarMutationVariables>;

/**
 * __useRemoveAvatarMutation__
 *
 * To run a mutation, you first call `useRemoveAvatarMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveAvatarMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeAvatarMutation, { data, loading, error }] = useRemoveAvatarMutation({
 *   variables: {
 *   },
 * });
 */
export function useRemoveAvatarMutation(baseOptions?: Apollo.MutationHookOptions<RemoveAvatarMutation, RemoveAvatarMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RemoveAvatarMutation, RemoveAvatarMutationVariables>(RemoveAvatarDocument, options);
      }
export type RemoveAvatarMutationHookResult = ReturnType<typeof useRemoveAvatarMutation>;
export type RemoveAvatarMutationResult = Apollo.MutationResult<RemoveAvatarMutation>;
export type RemoveAvatarMutationOptions = Apollo.BaseMutationOptions<RemoveAvatarMutation, RemoveAvatarMutationVariables>;
export const UserProfileDocument = gql`
    query UserProfile($handle: String!) {
  user(handle: $handle) {
    ...PublicUserFields
  }
}
    ${PublicUserFieldsFragmentDoc}`;

/**
 * __useUserProfileQuery__
 *
 * To run a query within a React component, call `useUserProfileQuery` and pass it any options that fit your needs.
 * When your component renders, `useUserProfileQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUserProfileQuery({
 *   variables: {
 *      handle: // value for 'handle'
 *   },
 * });
 */
export function useUserProfileQuery(baseOptions: Apollo.QueryHookOptions<UserProfileQuery, UserProfileQueryVariables> & ({ variables: UserProfileQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<UserProfileQuery, UserProfileQueryVariables>(UserProfileDocument, options);
      }
export function useUserProfileLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<UserProfileQuery, UserProfileQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<UserProfileQuery, UserProfileQueryVariables>(UserProfileDocument, options);
        }
// @ts-ignore
export function useUserProfileSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<UserProfileQuery, UserProfileQueryVariables>): Apollo.UseSuspenseQueryResult<UserProfileQuery, UserProfileQueryVariables>;
export function useUserProfileSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<UserProfileQuery, UserProfileQueryVariables>): Apollo.UseSuspenseQueryResult<UserProfileQuery | undefined, UserProfileQueryVariables>;
export function useUserProfileSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<UserProfileQuery, UserProfileQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<UserProfileQuery, UserProfileQueryVariables>(UserProfileDocument, options);
        }
export type UserProfileQueryHookResult = ReturnType<typeof useUserProfileQuery>;
export type UserProfileLazyQueryHookResult = ReturnType<typeof useUserProfileLazyQuery>;
export type UserProfileSuspenseQueryHookResult = ReturnType<typeof useUserProfileSuspenseQuery>;
export type UserProfileQueryResult = Apollo.QueryResult<UserProfileQuery, UserProfileQueryVariables>;
export const ProfileQualitiesDocument = gql`
    query ProfileQualities {
  profileQualities {
    key
  }
}
    `;

/**
 * __useProfileQualitiesQuery__
 *
 * To run a query within a React component, call `useProfileQualitiesQuery` and pass it any options that fit your needs.
 * When your component renders, `useProfileQualitiesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useProfileQualitiesQuery({
 *   variables: {
 *   },
 * });
 */
export function useProfileQualitiesQuery(baseOptions?: Apollo.QueryHookOptions<ProfileQualitiesQuery, ProfileQualitiesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ProfileQualitiesQuery, ProfileQualitiesQueryVariables>(ProfileQualitiesDocument, options);
      }
export function useProfileQualitiesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ProfileQualitiesQuery, ProfileQualitiesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ProfileQualitiesQuery, ProfileQualitiesQueryVariables>(ProfileQualitiesDocument, options);
        }
// @ts-ignore
export function useProfileQualitiesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ProfileQualitiesQuery, ProfileQualitiesQueryVariables>): Apollo.UseSuspenseQueryResult<ProfileQualitiesQuery, ProfileQualitiesQueryVariables>;
export function useProfileQualitiesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ProfileQualitiesQuery, ProfileQualitiesQueryVariables>): Apollo.UseSuspenseQueryResult<ProfileQualitiesQuery | undefined, ProfileQualitiesQueryVariables>;
export function useProfileQualitiesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ProfileQualitiesQuery, ProfileQualitiesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ProfileQualitiesQuery, ProfileQualitiesQueryVariables>(ProfileQualitiesDocument, options);
        }
export type ProfileQualitiesQueryHookResult = ReturnType<typeof useProfileQualitiesQuery>;
export type ProfileQualitiesLazyQueryHookResult = ReturnType<typeof useProfileQualitiesLazyQuery>;
export type ProfileQualitiesSuspenseQueryHookResult = ReturnType<typeof useProfileQualitiesSuspenseQuery>;
export type ProfileQualitiesQueryResult = Apollo.QueryResult<ProfileQualitiesQuery, ProfileQualitiesQueryVariables>;
export const UpdateProfileDocument = gql`
    mutation UpdateProfile($input: UpdateProfileInput!) {
  updateProfile(input: $input) {
    ...ViewerFields
  }
}
    ${ViewerFieldsFragmentDoc}`;
export type UpdateProfileMutationFn = Apollo.MutationFunction<UpdateProfileMutation, UpdateProfileMutationVariables>;

/**
 * __useUpdateProfileMutation__
 *
 * To run a mutation, you first call `useUpdateProfileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateProfileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateProfileMutation, { data, loading, error }] = useUpdateProfileMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateProfileMutation(baseOptions?: Apollo.MutationHookOptions<UpdateProfileMutation, UpdateProfileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateProfileMutation, UpdateProfileMutationVariables>(UpdateProfileDocument, options);
      }
export type UpdateProfileMutationHookResult = ReturnType<typeof useUpdateProfileMutation>;
export type UpdateProfileMutationResult = Apollo.MutationResult<UpdateProfileMutation>;
export type UpdateProfileMutationOptions = Apollo.BaseMutationOptions<UpdateProfileMutation, UpdateProfileMutationVariables>;
export const UpdatePrivateContactDocument = gql`
    mutation UpdatePrivateContact($input: UpdatePrivateContactInput!) {
  updatePrivateContact(input: $input) {
    ...ViewerFields
  }
}
    ${ViewerFieldsFragmentDoc}`;
export type UpdatePrivateContactMutationFn = Apollo.MutationFunction<UpdatePrivateContactMutation, UpdatePrivateContactMutationVariables>;

/**
 * __useUpdatePrivateContactMutation__
 *
 * To run a mutation, you first call `useUpdatePrivateContactMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdatePrivateContactMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updatePrivateContactMutation, { data, loading, error }] = useUpdatePrivateContactMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdatePrivateContactMutation(baseOptions?: Apollo.MutationHookOptions<UpdatePrivateContactMutation, UpdatePrivateContactMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdatePrivateContactMutation, UpdatePrivateContactMutationVariables>(UpdatePrivateContactDocument, options);
      }
export type UpdatePrivateContactMutationHookResult = ReturnType<typeof useUpdatePrivateContactMutation>;
export type UpdatePrivateContactMutationResult = Apollo.MutationResult<UpdatePrivateContactMutation>;
export type UpdatePrivateContactMutationOptions = Apollo.BaseMutationOptions<UpdatePrivateContactMutation, UpdatePrivateContactMutationVariables>;
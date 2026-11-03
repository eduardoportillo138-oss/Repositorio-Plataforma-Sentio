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
  name: Scalars['String']['input'];
  visibility?: InputMaybe<GroupVisibility>;
};

export type Group = {
  __typename?: 'Group';
  createdAt: Scalars['DateTime']['output'];
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
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
  | 'PRIVATE'
  | 'PUBLIC';

export type LoginInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type MembershipStatus =
  | 'ACTIVE'
  | 'BANNED'
  | 'PENDING';

export type Mutation = {
  __typename?: 'Mutation';
  createGroup: Group;
  login: AuthPayload;
  /** Cierra la sesión actual o todas (allDevices). */
  logout: Scalars['Boolean']['output'];
  /** Canjea un refresh token por un par nuevo. Si se omite `token`, se lee de la cookie. */
  refreshToken: AuthPayload;
  register: AuthPayload;
  /** Otorga o revoca el consentimiento para finalidades secundarias (marketing). */
  updateMarketingConsent: User;
  updateProfile: User;
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


export type MutationUpdateMarketingConsentArgs = {
  optIn: Scalars['Boolean']['input'];
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

export type Query = {
  __typename?: 'Query';
  /** Los grupos privados solo son visibles para sus miembros. */
  group: Group;
  groupMembers: GroupMemberConnection;
  /** Usuario autenticado. */
  me: User;
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

export type UpdateProfileInput = {
  avatarUrl?: InputMaybe<Scalars['String']['input']>;
  bio?: InputMaybe<Scalars['String']['input']>;
  displayName?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  avatarUrl: Maybe<Scalars['String']['output']>;
  bio: Maybe<Scalars['String']['output']>;
  /** Solo visible para el propio usuario. */
  consents: Maybe<Consents>;
  createdAt: Scalars['DateTime']['output'];
  displayName: Scalars['String']['output'];
  /** Solo visible para el propio usuario. */
  email: Maybe<Scalars['String']['output']>;
  handle: Scalars['String']['output'];
  id: Scalars['ID']['output'];
};

export type ViewerFieldsFragment = { __typename?: 'User', id: string, handle: string, displayName: string, avatarUrl: string | null, bio: string | null, email: string | null, createdAt: string, consents: { __typename?: 'Consents', privacyNoticeVersion: string, privacyNoticeAcceptedAt: string, marketingOptIn: boolean } | null };

export type AuthPayloadFieldsFragment = { __typename?: 'AuthPayload', accessToken: string, accessTokenExpiresAt: string, refreshToken: string | null, refreshTokenExpiresAt: string, user: { __typename?: 'User', id: string, handle: string, displayName: string, avatarUrl: string | null, bio: string | null, email: string | null, createdAt: string, consents: { __typename?: 'Consents', privacyNoticeVersion: string, privacyNoticeAcceptedAt: string, marketingOptIn: boolean } | null } };

export type RegisterMutationVariables = Exact<{
  input: RegisterInput;
}>;


export type RegisterMutation = { __typename?: 'Mutation', register: { __typename?: 'AuthPayload', accessToken: string, accessTokenExpiresAt: string, refreshToken: string | null, refreshTokenExpiresAt: string, user: { __typename?: 'User', id: string, handle: string, displayName: string, avatarUrl: string | null, bio: string | null, email: string | null, createdAt: string, consents: { __typename?: 'Consents', privacyNoticeVersion: string, privacyNoticeAcceptedAt: string, marketingOptIn: boolean } | null } } };

export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'AuthPayload', accessToken: string, accessTokenExpiresAt: string, refreshToken: string | null, refreshTokenExpiresAt: string, user: { __typename?: 'User', id: string, handle: string, displayName: string, avatarUrl: string | null, bio: string | null, email: string | null, createdAt: string, consents: { __typename?: 'Consents', privacyNoticeVersion: string, privacyNoticeAcceptedAt: string, marketingOptIn: boolean } | null } } };

export type RefreshTokenMutationVariables = Exact<{
  token?: InputMaybe<Scalars['String']['input']>;
}>;


export type RefreshTokenMutation = { __typename?: 'Mutation', refreshToken: { __typename?: 'AuthPayload', accessToken: string, accessTokenExpiresAt: string, refreshToken: string | null, refreshTokenExpiresAt: string, user: { __typename?: 'User', id: string, handle: string, displayName: string, avatarUrl: string | null, bio: string | null, email: string | null, createdAt: string, consents: { __typename?: 'Consents', privacyNoticeVersion: string, privacyNoticeAcceptedAt: string, marketingOptIn: boolean } | null } } };

export type LogoutMutationVariables = Exact<{
  allDevices?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type LogoutMutation = { __typename?: 'Mutation', logout: boolean };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me: { __typename?: 'User', id: string, handle: string, displayName: string, avatarUrl: string | null, bio: string | null, email: string | null, createdAt: string, consents: { __typename?: 'Consents', privacyNoticeVersion: string, privacyNoticeAcceptedAt: string, marketingOptIn: boolean } | null } };

export const ViewerFieldsFragmentDoc = gql`
    fragment ViewerFields on User {
  id
  handle
  displayName
  avatarUrl
  bio
  email
  createdAt
  consents {
    privacyNoticeVersion
    privacyNoticeAcceptedAt
    marketingOptIn
  }
}
    `;
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
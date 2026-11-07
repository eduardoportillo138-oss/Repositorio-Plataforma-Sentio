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

export type Comment = {
  __typename?: 'Comment';
  /** Datos públicos del autor. */
  author: PublicUser;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  /** Post comentado (para actualizar contadores en la caché del cliente). */
  post: Maybe<Post>;
  text: Scalars['String']['output'];
  /** true si el usuario actual puede borrarlo (autor del comentario o del post). */
  viewerCanDelete: Scalars['Boolean']['output'];
};

export type CommentConnection = {
  __typename?: 'CommentConnection';
  edges: Array<CommentEdge>;
  pageInfo: PageInfo;
};

export type CommentEdge = {
  __typename?: 'CommentEdge';
  cursor: Scalars['String']['output'];
  node: Comment;
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

export type CreatePostInput = {
  /** Hasta 5000 caracteres. */
  text?: InputMaybe<Scalars['String']['input']>;
  /** De 1 a 120 caracteres. */
  title: Scalars['String']['input'];
  visibility?: InputMaybe<PostVisibility>;
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
  /** Comenta una publicación (de 1 a 1000 caracteres). */
  addComment: Comment;
  /** Paso 2: confirma la subida y la manda a procesar. Si las colas están activas el resultado llega por Socket.IO (media:ready); si no, se devuelve ya procesado. */
  confirmAvatarUpload: MediaAsset;
  createGroup: Group;
  /** Crea una publicación (máximo 10 por hora). */
  createPost: Post;
  /** Borra un comentario (su autor o el autor del post). Devuelve el post actualizado. */
  deleteComment: Maybe<Post>;
  /** Borra (lógicamente) una publicación propia. */
  deletePost: Scalars['ID']['output'];
  login: AuthPayload;
  /** Cierra la sesión actual o todas (allDevices). */
  logout: Scalars['Boolean']['output'];
  /** Marca como leídas las indicadas, o todas si no se indican. Devuelve cuántas. */
  markNotificationsRead: Scalars['Int']['output'];
  /** Canjea un refresh token por un par nuevo. Si se omite `token`, se lee de la cookie. */
  refreshToken: AuthPayload;
  register: AuthPayload;
  /** Quita la foto de perfil. */
  removeAvatar: User;
  /** Paso 1 de la foto de perfil: JPEG, PNG, WebP o HEIC de hasta 5 MB. Devuelve una URL prefirmada (PUT) válida 10 minutos. */
  requestAvatarUpload: AvatarUploadTicket;
  /** Comparte una publicación pública con hasta 10 personas (crea una notificación para cada una). */
  sharePost: SharePostResult;
  /** Da o quita "Me gusta". Devuelve el post con contador y viewerHasLiked al día. */
  toggleLike: Post;
  /** Otorga o revoca el consentimiento para finalidades secundarias (marketing). */
  updateMarketingConsent: User;
  /** Actualiza los datos de contacto privados. */
  updatePrivateContact: User;
  /** Actualiza nombre, biografía y cualidades. */
  updateProfile: User;
};


export type MutationAddCommentArgs = {
  postId: Scalars['ID']['input'];
  text: Scalars['String']['input'];
};


export type MutationConfirmAvatarUploadArgs = {
  assetId: Scalars['ID']['input'];
};


export type MutationCreateGroupArgs = {
  input: CreateGroupInput;
};


export type MutationCreatePostArgs = {
  input: CreatePostInput;
};


export type MutationDeleteCommentArgs = {
  commentId: Scalars['ID']['input'];
};


export type MutationDeletePostArgs = {
  postId: Scalars['ID']['input'];
};


export type MutationLoginArgs = {
  input: LoginInput;
};


export type MutationLogoutArgs = {
  allDevices?: Scalars['Boolean']['input'];
};


export type MutationMarkNotificationsReadArgs = {
  ids?: InputMaybe<Array<Scalars['ID']['input']>>;
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


export type MutationSharePostArgs = {
  message?: InputMaybe<Scalars['String']['input']>;
  postId: Scalars['ID']['input'];
  recipientIds: Array<Scalars['ID']['input']>;
};


export type MutationToggleLikeArgs = {
  postId: Scalars['ID']['input'];
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

export type Notification = {
  __typename?: 'Notification';
  /** Quién la originó. */
  actor: Maybe<PublicUser>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  message: Maybe<Scalars['String']['output']>;
  /** Publicación relacionada, si existe y el usuario la puede ver. */
  post: Maybe<Post>;
  readAt: Maybe<Scalars['DateTime']['output']>;
  /** share, comment, reaction… */
  type: Scalars['String']['output'];
};

export type NotificationConnection = {
  __typename?: 'NotificationConnection';
  edges: Array<NotificationEdge>;
  pageInfo: PageInfo;
};

export type NotificationEdge = {
  __typename?: 'NotificationEdge';
  cursor: Scalars['String']['output'];
  node: Notification;
};

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor: Maybe<Scalars['String']['output']>;
};

export type Post = {
  __typename?: 'Post';
  /** Datos públicos actuales del autor (nunca datos privados). */
  author: PublicUser;
  counts: PostCounts;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  text: Scalars['String']['output'];
  title: Scalars['String']['output'];
  /** true si el usuario actual le dio Me gusta (en lote por página). */
  viewerHasLiked: Scalars['Boolean']['output'];
  /** true si el usuario actual es el autor. */
  viewerIsAuthor: Scalars['Boolean']['output'];
  visibility: PostVisibility;
};

export type PostConnection = {
  __typename?: 'PostConnection';
  edges: Array<PostEdge>;
  pageInfo: PageInfo;
};

export type PostCounts = {
  __typename?: 'PostCounts';
  comments: Scalars['Int']['output'];
  reactions: Scalars['Int']['output'];
  shares: Scalars['Int']['output'];
};

export type PostEdge = {
  __typename?: 'PostEdge';
  cursor: Scalars['String']['output'];
  node: Post;
};

export type PostVisibility =
  /** Solo sus seguidores (y el autor). */
  | 'followers'
  /** Cualquier persona con sesión iniciada. */
  | 'public';

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

export type PublicUser = {
  __typename?: 'PublicUser';
  avatar: Maybe<Avatar>;
  bio: Maybe<Scalars['String']['output']>;
  displayName: Scalars['String']['output'];
  handle: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  tags: Array<Scalars['String']['output']>;
};

export type PublicUserConnection = {
  __typename?: 'PublicUserConnection';
  edges: Array<PublicUserEdge>;
  pageInfo: PageInfo;
};

export type PublicUserEdge = {
  __typename?: 'PublicUserEdge';
  cursor: Scalars['String']['output'];
  node: PublicUser;
};

export type Query = {
  __typename?: 'Query';
  /** Devuelve null si el grupo no existe o el usuario no puede verlo (sin distinguir los casos, para no revelar la existencia de grupos privados). */
  group: Maybe<Group>;
  groupMembers: GroupMemberConnection;
  /** Inicio: publicaciones públicas, de la más reciente a la más antigua. */
  homeFeed: PostConnection;
  /** Usuario autenticado. */
  me: User;
  /** Mis notificaciones, de la más reciente a la más antigua. */
  notifications: NotificationConnection;
  /** Detalle de una publicación. null si no existe o no se puede ver. */
  post: Maybe<Post>;
  /** Comentarios de primer nivel, del más antiguo al más reciente. */
  postComments: CommentConnection;
  /** Catálogo de cualidades para las etiquetas del perfil (el cliente las traduce). */
  profileQualities: Array<ProfileQuality>;
  /** Busca personas por nombre o @handle (de 2 a 80 caracteres). Solo datos públicos. */
  searchUsers: PublicUserConnection;
  /** Cuántas notificaciones sin leer tengo. */
  unreadNotificationsCount: Scalars['Int']['output'];
  /** Perfil público por handle. */
  user: Maybe<User>;
  /** Publicaciones de un perfil. */
  userPosts: PostConnection;
};


export type QueryGroupArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGroupMembersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  groupId: Scalars['ID']['input'];
};


export type QueryHomeFeedArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryNotificationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPostArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPostCommentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  postId: Scalars['ID']['input'];
};


export type QuerySearchUsersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};


export type QueryUserArgs = {
  handle: Scalars['String']['input'];
};


export type QueryUserPostsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
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

export type SharePostResult = {
  __typename?: 'SharePostResult';
  /** El post con counts.shares actualizado. */
  post: Post;
  /** A cuántas personas se envió. */
  sentTo: Scalars['Int']['output'];
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

export type PostCountsFieldsFragment = { __typename?: 'Post', id: string, viewerHasLiked: boolean, counts: { __typename?: 'PostCounts', reactions: number, comments: number, shares: number } };

export type CommentFieldsFragment = { __typename?: 'Comment', id: string, text: string, createdAt: string, viewerCanDelete: boolean, author: { __typename?: 'PublicUser', id: string, handle: string, displayName: string, avatar: { __typename?: 'Avatar', assetId: string, url256: string, url512: string, blurhash: string } | null } };

export type PostDetailQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type PostDetailQuery = { __typename?: 'Query', post: { __typename?: 'Post', id: string, title: string, text: string, visibility: PostVisibility, createdAt: string, viewerIsAuthor: boolean, viewerHasLiked: boolean, counts: { __typename?: 'PostCounts', reactions: number, comments: number, shares: number }, author: { __typename?: 'PublicUser', id: string, handle: string, displayName: string, avatar: { __typename?: 'Avatar', assetId: string, url256: string, url512: string, blurhash: string } | null } } | null };

export type ToggleLikeMutationVariables = Exact<{
  postId: Scalars['ID']['input'];
}>;


export type ToggleLikeMutation = { __typename?: 'Mutation', toggleLike: { __typename?: 'Post', id: string, viewerHasLiked: boolean, counts: { __typename?: 'PostCounts', reactions: number, comments: number, shares: number } } };

export type PostCommentsQueryVariables = Exact<{
  postId: Scalars['ID']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;


export type PostCommentsQuery = { __typename?: 'Query', postComments: { __typename?: 'CommentConnection', edges: Array<{ __typename?: 'CommentEdge', cursor: string, node: { __typename?: 'Comment', id: string, text: string, createdAt: string, viewerCanDelete: boolean, author: { __typename?: 'PublicUser', id: string, handle: string, displayName: string, avatar: { __typename?: 'Avatar', assetId: string, url256: string, url512: string, blurhash: string } | null } } }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, endCursor: string | null } } };

export type AddCommentMutationVariables = Exact<{
  postId: Scalars['ID']['input'];
  text: Scalars['String']['input'];
}>;


export type AddCommentMutation = { __typename?: 'Mutation', addComment: { __typename?: 'Comment', id: string, text: string, createdAt: string, viewerCanDelete: boolean, post: { __typename?: 'Post', id: string, viewerHasLiked: boolean, counts: { __typename?: 'PostCounts', reactions: number, comments: number, shares: number } } | null, author: { __typename?: 'PublicUser', id: string, handle: string, displayName: string, avatar: { __typename?: 'Avatar', assetId: string, url256: string, url512: string, blurhash: string } | null } } };

export type DeleteCommentMutationVariables = Exact<{
  commentId: Scalars['ID']['input'];
}>;


export type DeleteCommentMutation = { __typename?: 'Mutation', deleteComment: { __typename?: 'Post', id: string, viewerHasLiked: boolean, counts: { __typename?: 'PostCounts', reactions: number, comments: number, shares: number } } | null };

export type SharePostMutationVariables = Exact<{
  postId: Scalars['ID']['input'];
  recipientIds: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
  message?: InputMaybe<Scalars['String']['input']>;
}>;


export type SharePostMutation = { __typename?: 'Mutation', sharePost: { __typename?: 'SharePostResult', sentTo: number, post: { __typename?: 'Post', id: string, viewerHasLiked: boolean, counts: { __typename?: 'PostCounts', reactions: number, comments: number, shares: number } } } };

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

export type NotificationFieldsFragment = { __typename?: 'Notification', id: string, type: string, message: string | null, readAt: string | null, createdAt: string, actor: { __typename?: 'PublicUser', id: string, handle: string, displayName: string, avatar: { __typename?: 'Avatar', assetId: string, url256: string, url512: string, blurhash: string } | null } | null, post: { __typename?: 'Post', id: string, title: string } | null };

export type NotificationsQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;


export type NotificationsQuery = { __typename?: 'Query', notifications: { __typename?: 'NotificationConnection', edges: Array<{ __typename?: 'NotificationEdge', cursor: string, node: { __typename?: 'Notification', id: string, type: string, message: string | null, readAt: string | null, createdAt: string, actor: { __typename?: 'PublicUser', id: string, handle: string, displayName: string, avatar: { __typename?: 'Avatar', assetId: string, url256: string, url512: string, blurhash: string } | null } | null, post: { __typename?: 'Post', id: string, title: string } | null } }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, endCursor: string | null } } };

export type UnreadNotificationsCountQueryVariables = Exact<{ [key: string]: never; }>;


export type UnreadNotificationsCountQuery = { __typename?: 'Query', unreadNotificationsCount: number };

export type MarkNotificationsReadMutationVariables = Exact<{
  ids?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>;
}>;


export type MarkNotificationsReadMutation = { __typename?: 'Mutation', markNotificationsRead: number };

export type PostAuthorFieldsFragment = { __typename?: 'PublicUser', id: string, handle: string, displayName: string, avatar: { __typename?: 'Avatar', assetId: string, url256: string, url512: string, blurhash: string } | null };

export type PostFieldsFragment = { __typename?: 'Post', id: string, title: string, text: string, visibility: PostVisibility, createdAt: string, viewerIsAuthor: boolean, viewerHasLiked: boolean, counts: { __typename?: 'PostCounts', reactions: number, comments: number, shares: number }, author: { __typename?: 'PublicUser', id: string, handle: string, displayName: string, avatar: { __typename?: 'Avatar', assetId: string, url256: string, url512: string, blurhash: string } | null } };

export type HomeFeedQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;


export type HomeFeedQuery = { __typename?: 'Query', homeFeed: { __typename?: 'PostConnection', edges: Array<{ __typename?: 'PostEdge', cursor: string, node: { __typename?: 'Post', id: string, title: string, text: string, visibility: PostVisibility, createdAt: string, viewerIsAuthor: boolean, viewerHasLiked: boolean, counts: { __typename?: 'PostCounts', reactions: number, comments: number, shares: number }, author: { __typename?: 'PublicUser', id: string, handle: string, displayName: string, avatar: { __typename?: 'Avatar', assetId: string, url256: string, url512: string, blurhash: string } | null } } }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, endCursor: string | null } } };

export type UserPostsQueryVariables = Exact<{
  handle: Scalars['String']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;


export type UserPostsQuery = { __typename?: 'Query', userPosts: { __typename?: 'PostConnection', edges: Array<{ __typename?: 'PostEdge', cursor: string, node: { __typename?: 'Post', id: string, title: string, text: string, visibility: PostVisibility, createdAt: string, viewerIsAuthor: boolean, viewerHasLiked: boolean, counts: { __typename?: 'PostCounts', reactions: number, comments: number, shares: number }, author: { __typename?: 'PublicUser', id: string, handle: string, displayName: string, avatar: { __typename?: 'Avatar', assetId: string, url256: string, url512: string, blurhash: string } | null } } }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, endCursor: string | null } } };

export type CreatePostMutationVariables = Exact<{
  input: CreatePostInput;
}>;


export type CreatePostMutation = { __typename?: 'Mutation', createPost: { __typename?: 'Post', id: string, title: string, text: string, visibility: PostVisibility, createdAt: string, viewerIsAuthor: boolean, viewerHasLiked: boolean, counts: { __typename?: 'PostCounts', reactions: number, comments: number, shares: number }, author: { __typename?: 'PublicUser', id: string, handle: string, displayName: string, avatar: { __typename?: 'Avatar', assetId: string, url256: string, url512: string, blurhash: string } | null } } };

export type DeletePostMutationVariables = Exact<{
  postId: Scalars['ID']['input'];
}>;


export type DeletePostMutation = { __typename?: 'Mutation', deletePost: string };

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

export type UserSearchFieldsFragment = { __typename?: 'PublicUser', id: string, handle: string, displayName: string, tags: Array<string>, avatar: { __typename?: 'Avatar', assetId: string, url256: string, url512: string, blurhash: string } | null };

export type SearchUsersQueryVariables = Exact<{
  query: Scalars['String']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;


export type SearchUsersQuery = { __typename?: 'Query', searchUsers: { __typename?: 'PublicUserConnection', edges: Array<{ __typename?: 'PublicUserEdge', cursor: string, node: { __typename?: 'PublicUser', id: string, handle: string, displayName: string, tags: Array<string>, avatar: { __typename?: 'Avatar', assetId: string, url256: string, url512: string, blurhash: string } | null } }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, endCursor: string | null } } };

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
export const PostCountsFieldsFragmentDoc = gql`
    fragment PostCountsFields on Post {
  id
  viewerHasLiked
  counts {
    reactions
    comments
    shares
  }
}
    `;
export const PostAuthorFieldsFragmentDoc = gql`
    fragment PostAuthorFields on PublicUser {
  id
  handle
  displayName
  avatar {
    ...AvatarFields
  }
}
    ${AvatarFieldsFragmentDoc}`;
export const CommentFieldsFragmentDoc = gql`
    fragment CommentFields on Comment {
  id
  text
  createdAt
  viewerCanDelete
  author {
    ...PostAuthorFields
  }
}
    ${PostAuthorFieldsFragmentDoc}`;
export const NotificationFieldsFragmentDoc = gql`
    fragment NotificationFields on Notification {
  id
  type
  message
  readAt
  createdAt
  actor {
    ...PostAuthorFields
  }
  post {
    id
    title
  }
}
    ${PostAuthorFieldsFragmentDoc}`;
export const PostFieldsFragmentDoc = gql`
    fragment PostFields on Post {
  id
  title
  text
  visibility
  createdAt
  viewerIsAuthor
  viewerHasLiked
  counts {
    reactions
    comments
    shares
  }
  author {
    ...PostAuthorFields
  }
}
    ${PostAuthorFieldsFragmentDoc}`;
export const UserSearchFieldsFragmentDoc = gql`
    fragment UserSearchFields on PublicUser {
  id
  handle
  displayName
  tags
  avatar {
    ...AvatarFields
  }
}
    ${AvatarFieldsFragmentDoc}`;
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
export const PostDetailDocument = gql`
    query PostDetail($id: ID!) {
  post(id: $id) {
    ...PostFields
  }
}
    ${PostFieldsFragmentDoc}`;

/**
 * __usePostDetailQuery__
 *
 * To run a query within a React component, call `usePostDetailQuery` and pass it any options that fit your needs.
 * When your component renders, `usePostDetailQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePostDetailQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function usePostDetailQuery(baseOptions: Apollo.QueryHookOptions<PostDetailQuery, PostDetailQueryVariables> & ({ variables: PostDetailQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PostDetailQuery, PostDetailQueryVariables>(PostDetailDocument, options);
      }
export function usePostDetailLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PostDetailQuery, PostDetailQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PostDetailQuery, PostDetailQueryVariables>(PostDetailDocument, options);
        }
// @ts-ignore
export function usePostDetailSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<PostDetailQuery, PostDetailQueryVariables>): Apollo.UseSuspenseQueryResult<PostDetailQuery, PostDetailQueryVariables>;
export function usePostDetailSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PostDetailQuery, PostDetailQueryVariables>): Apollo.UseSuspenseQueryResult<PostDetailQuery | undefined, PostDetailQueryVariables>;
export function usePostDetailSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PostDetailQuery, PostDetailQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<PostDetailQuery, PostDetailQueryVariables>(PostDetailDocument, options);
        }
export type PostDetailQueryHookResult = ReturnType<typeof usePostDetailQuery>;
export type PostDetailLazyQueryHookResult = ReturnType<typeof usePostDetailLazyQuery>;
export type PostDetailSuspenseQueryHookResult = ReturnType<typeof usePostDetailSuspenseQuery>;
export type PostDetailQueryResult = Apollo.QueryResult<PostDetailQuery, PostDetailQueryVariables>;
export const ToggleLikeDocument = gql`
    mutation ToggleLike($postId: ID!) {
  toggleLike(postId: $postId) {
    ...PostCountsFields
  }
}
    ${PostCountsFieldsFragmentDoc}`;
export type ToggleLikeMutationFn = Apollo.MutationFunction<ToggleLikeMutation, ToggleLikeMutationVariables>;

/**
 * __useToggleLikeMutation__
 *
 * To run a mutation, you first call `useToggleLikeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useToggleLikeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [toggleLikeMutation, { data, loading, error }] = useToggleLikeMutation({
 *   variables: {
 *      postId: // value for 'postId'
 *   },
 * });
 */
export function useToggleLikeMutation(baseOptions?: Apollo.MutationHookOptions<ToggleLikeMutation, ToggleLikeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ToggleLikeMutation, ToggleLikeMutationVariables>(ToggleLikeDocument, options);
      }
export type ToggleLikeMutationHookResult = ReturnType<typeof useToggleLikeMutation>;
export type ToggleLikeMutationResult = Apollo.MutationResult<ToggleLikeMutation>;
export type ToggleLikeMutationOptions = Apollo.BaseMutationOptions<ToggleLikeMutation, ToggleLikeMutationVariables>;
export const PostCommentsDocument = gql`
    query PostComments($postId: ID!, $first: Int = 20, $after: String) {
  postComments(postId: $postId, first: $first, after: $after) {
    edges {
      cursor
      node {
        ...CommentFields
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
    ${CommentFieldsFragmentDoc}`;

/**
 * __usePostCommentsQuery__
 *
 * To run a query within a React component, call `usePostCommentsQuery` and pass it any options that fit your needs.
 * When your component renders, `usePostCommentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePostCommentsQuery({
 *   variables: {
 *      postId: // value for 'postId'
 *      first: // value for 'first'
 *      after: // value for 'after'
 *   },
 * });
 */
export function usePostCommentsQuery(baseOptions: Apollo.QueryHookOptions<PostCommentsQuery, PostCommentsQueryVariables> & ({ variables: PostCommentsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PostCommentsQuery, PostCommentsQueryVariables>(PostCommentsDocument, options);
      }
export function usePostCommentsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PostCommentsQuery, PostCommentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PostCommentsQuery, PostCommentsQueryVariables>(PostCommentsDocument, options);
        }
// @ts-ignore
export function usePostCommentsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<PostCommentsQuery, PostCommentsQueryVariables>): Apollo.UseSuspenseQueryResult<PostCommentsQuery, PostCommentsQueryVariables>;
export function usePostCommentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PostCommentsQuery, PostCommentsQueryVariables>): Apollo.UseSuspenseQueryResult<PostCommentsQuery | undefined, PostCommentsQueryVariables>;
export function usePostCommentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PostCommentsQuery, PostCommentsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<PostCommentsQuery, PostCommentsQueryVariables>(PostCommentsDocument, options);
        }
export type PostCommentsQueryHookResult = ReturnType<typeof usePostCommentsQuery>;
export type PostCommentsLazyQueryHookResult = ReturnType<typeof usePostCommentsLazyQuery>;
export type PostCommentsSuspenseQueryHookResult = ReturnType<typeof usePostCommentsSuspenseQuery>;
export type PostCommentsQueryResult = Apollo.QueryResult<PostCommentsQuery, PostCommentsQueryVariables>;
export const AddCommentDocument = gql`
    mutation AddComment($postId: ID!, $text: String!) {
  addComment(postId: $postId, text: $text) {
    ...CommentFields
    post {
      ...PostCountsFields
    }
  }
}
    ${CommentFieldsFragmentDoc}
${PostCountsFieldsFragmentDoc}`;
export type AddCommentMutationFn = Apollo.MutationFunction<AddCommentMutation, AddCommentMutationVariables>;

/**
 * __useAddCommentMutation__
 *
 * To run a mutation, you first call `useAddCommentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddCommentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addCommentMutation, { data, loading, error }] = useAddCommentMutation({
 *   variables: {
 *      postId: // value for 'postId'
 *      text: // value for 'text'
 *   },
 * });
 */
export function useAddCommentMutation(baseOptions?: Apollo.MutationHookOptions<AddCommentMutation, AddCommentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddCommentMutation, AddCommentMutationVariables>(AddCommentDocument, options);
      }
export type AddCommentMutationHookResult = ReturnType<typeof useAddCommentMutation>;
export type AddCommentMutationResult = Apollo.MutationResult<AddCommentMutation>;
export type AddCommentMutationOptions = Apollo.BaseMutationOptions<AddCommentMutation, AddCommentMutationVariables>;
export const DeleteCommentDocument = gql`
    mutation DeleteComment($commentId: ID!) {
  deleteComment(commentId: $commentId) {
    ...PostCountsFields
  }
}
    ${PostCountsFieldsFragmentDoc}`;
export type DeleteCommentMutationFn = Apollo.MutationFunction<DeleteCommentMutation, DeleteCommentMutationVariables>;

/**
 * __useDeleteCommentMutation__
 *
 * To run a mutation, you first call `useDeleteCommentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteCommentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteCommentMutation, { data, loading, error }] = useDeleteCommentMutation({
 *   variables: {
 *      commentId: // value for 'commentId'
 *   },
 * });
 */
export function useDeleteCommentMutation(baseOptions?: Apollo.MutationHookOptions<DeleteCommentMutation, DeleteCommentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteCommentMutation, DeleteCommentMutationVariables>(DeleteCommentDocument, options);
      }
export type DeleteCommentMutationHookResult = ReturnType<typeof useDeleteCommentMutation>;
export type DeleteCommentMutationResult = Apollo.MutationResult<DeleteCommentMutation>;
export type DeleteCommentMutationOptions = Apollo.BaseMutationOptions<DeleteCommentMutation, DeleteCommentMutationVariables>;
export const SharePostDocument = gql`
    mutation SharePost($postId: ID!, $recipientIds: [ID!]!, $message: String) {
  sharePost(postId: $postId, recipientIds: $recipientIds, message: $message) {
    sentTo
    post {
      ...PostCountsFields
    }
  }
}
    ${PostCountsFieldsFragmentDoc}`;
export type SharePostMutationFn = Apollo.MutationFunction<SharePostMutation, SharePostMutationVariables>;

/**
 * __useSharePostMutation__
 *
 * To run a mutation, you first call `useSharePostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSharePostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [sharePostMutation, { data, loading, error }] = useSharePostMutation({
 *   variables: {
 *      postId: // value for 'postId'
 *      recipientIds: // value for 'recipientIds'
 *      message: // value for 'message'
 *   },
 * });
 */
export function useSharePostMutation(baseOptions?: Apollo.MutationHookOptions<SharePostMutation, SharePostMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SharePostMutation, SharePostMutationVariables>(SharePostDocument, options);
      }
export type SharePostMutationHookResult = ReturnType<typeof useSharePostMutation>;
export type SharePostMutationResult = Apollo.MutationResult<SharePostMutation>;
export type SharePostMutationOptions = Apollo.BaseMutationOptions<SharePostMutation, SharePostMutationVariables>;
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
export const NotificationsDocument = gql`
    query Notifications($first: Int = 20, $after: String) {
  notifications(first: $first, after: $after) {
    edges {
      cursor
      node {
        ...NotificationFields
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
    ${NotificationFieldsFragmentDoc}`;

/**
 * __useNotificationsQuery__
 *
 * To run a query within a React component, call `useNotificationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useNotificationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useNotificationsQuery({
 *   variables: {
 *      first: // value for 'first'
 *      after: // value for 'after'
 *   },
 * });
 */
export function useNotificationsQuery(baseOptions?: Apollo.QueryHookOptions<NotificationsQuery, NotificationsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<NotificationsQuery, NotificationsQueryVariables>(NotificationsDocument, options);
      }
export function useNotificationsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<NotificationsQuery, NotificationsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<NotificationsQuery, NotificationsQueryVariables>(NotificationsDocument, options);
        }
// @ts-ignore
export function useNotificationsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<NotificationsQuery, NotificationsQueryVariables>): Apollo.UseSuspenseQueryResult<NotificationsQuery, NotificationsQueryVariables>;
export function useNotificationsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<NotificationsQuery, NotificationsQueryVariables>): Apollo.UseSuspenseQueryResult<NotificationsQuery | undefined, NotificationsQueryVariables>;
export function useNotificationsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<NotificationsQuery, NotificationsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<NotificationsQuery, NotificationsQueryVariables>(NotificationsDocument, options);
        }
export type NotificationsQueryHookResult = ReturnType<typeof useNotificationsQuery>;
export type NotificationsLazyQueryHookResult = ReturnType<typeof useNotificationsLazyQuery>;
export type NotificationsSuspenseQueryHookResult = ReturnType<typeof useNotificationsSuspenseQuery>;
export type NotificationsQueryResult = Apollo.QueryResult<NotificationsQuery, NotificationsQueryVariables>;
export const UnreadNotificationsCountDocument = gql`
    query UnreadNotificationsCount {
  unreadNotificationsCount
}
    `;

/**
 * __useUnreadNotificationsCountQuery__
 *
 * To run a query within a React component, call `useUnreadNotificationsCountQuery` and pass it any options that fit your needs.
 * When your component renders, `useUnreadNotificationsCountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUnreadNotificationsCountQuery({
 *   variables: {
 *   },
 * });
 */
export function useUnreadNotificationsCountQuery(baseOptions?: Apollo.QueryHookOptions<UnreadNotificationsCountQuery, UnreadNotificationsCountQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<UnreadNotificationsCountQuery, UnreadNotificationsCountQueryVariables>(UnreadNotificationsCountDocument, options);
      }
export function useUnreadNotificationsCountLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<UnreadNotificationsCountQuery, UnreadNotificationsCountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<UnreadNotificationsCountQuery, UnreadNotificationsCountQueryVariables>(UnreadNotificationsCountDocument, options);
        }
// @ts-ignore
export function useUnreadNotificationsCountSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<UnreadNotificationsCountQuery, UnreadNotificationsCountQueryVariables>): Apollo.UseSuspenseQueryResult<UnreadNotificationsCountQuery, UnreadNotificationsCountQueryVariables>;
export function useUnreadNotificationsCountSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<UnreadNotificationsCountQuery, UnreadNotificationsCountQueryVariables>): Apollo.UseSuspenseQueryResult<UnreadNotificationsCountQuery | undefined, UnreadNotificationsCountQueryVariables>;
export function useUnreadNotificationsCountSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<UnreadNotificationsCountQuery, UnreadNotificationsCountQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<UnreadNotificationsCountQuery, UnreadNotificationsCountQueryVariables>(UnreadNotificationsCountDocument, options);
        }
export type UnreadNotificationsCountQueryHookResult = ReturnType<typeof useUnreadNotificationsCountQuery>;
export type UnreadNotificationsCountLazyQueryHookResult = ReturnType<typeof useUnreadNotificationsCountLazyQuery>;
export type UnreadNotificationsCountSuspenseQueryHookResult = ReturnType<typeof useUnreadNotificationsCountSuspenseQuery>;
export type UnreadNotificationsCountQueryResult = Apollo.QueryResult<UnreadNotificationsCountQuery, UnreadNotificationsCountQueryVariables>;
export const MarkNotificationsReadDocument = gql`
    mutation MarkNotificationsRead($ids: [ID!]) {
  markNotificationsRead(ids: $ids)
}
    `;
export type MarkNotificationsReadMutationFn = Apollo.MutationFunction<MarkNotificationsReadMutation, MarkNotificationsReadMutationVariables>;

/**
 * __useMarkNotificationsReadMutation__
 *
 * To run a mutation, you first call `useMarkNotificationsReadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useMarkNotificationsReadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [markNotificationsReadMutation, { data, loading, error }] = useMarkNotificationsReadMutation({
 *   variables: {
 *      ids: // value for 'ids'
 *   },
 * });
 */
export function useMarkNotificationsReadMutation(baseOptions?: Apollo.MutationHookOptions<MarkNotificationsReadMutation, MarkNotificationsReadMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<MarkNotificationsReadMutation, MarkNotificationsReadMutationVariables>(MarkNotificationsReadDocument, options);
      }
export type MarkNotificationsReadMutationHookResult = ReturnType<typeof useMarkNotificationsReadMutation>;
export type MarkNotificationsReadMutationResult = Apollo.MutationResult<MarkNotificationsReadMutation>;
export type MarkNotificationsReadMutationOptions = Apollo.BaseMutationOptions<MarkNotificationsReadMutation, MarkNotificationsReadMutationVariables>;
export const HomeFeedDocument = gql`
    query HomeFeed($first: Int = 20, $after: String) {
  homeFeed(first: $first, after: $after) {
    edges {
      cursor
      node {
        ...PostFields
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
    ${PostFieldsFragmentDoc}`;

/**
 * __useHomeFeedQuery__
 *
 * To run a query within a React component, call `useHomeFeedQuery` and pass it any options that fit your needs.
 * When your component renders, `useHomeFeedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHomeFeedQuery({
 *   variables: {
 *      first: // value for 'first'
 *      after: // value for 'after'
 *   },
 * });
 */
export function useHomeFeedQuery(baseOptions?: Apollo.QueryHookOptions<HomeFeedQuery, HomeFeedQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<HomeFeedQuery, HomeFeedQueryVariables>(HomeFeedDocument, options);
      }
export function useHomeFeedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<HomeFeedQuery, HomeFeedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<HomeFeedQuery, HomeFeedQueryVariables>(HomeFeedDocument, options);
        }
// @ts-ignore
export function useHomeFeedSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<HomeFeedQuery, HomeFeedQueryVariables>): Apollo.UseSuspenseQueryResult<HomeFeedQuery, HomeFeedQueryVariables>;
export function useHomeFeedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<HomeFeedQuery, HomeFeedQueryVariables>): Apollo.UseSuspenseQueryResult<HomeFeedQuery | undefined, HomeFeedQueryVariables>;
export function useHomeFeedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<HomeFeedQuery, HomeFeedQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<HomeFeedQuery, HomeFeedQueryVariables>(HomeFeedDocument, options);
        }
export type HomeFeedQueryHookResult = ReturnType<typeof useHomeFeedQuery>;
export type HomeFeedLazyQueryHookResult = ReturnType<typeof useHomeFeedLazyQuery>;
export type HomeFeedSuspenseQueryHookResult = ReturnType<typeof useHomeFeedSuspenseQuery>;
export type HomeFeedQueryResult = Apollo.QueryResult<HomeFeedQuery, HomeFeedQueryVariables>;
export const UserPostsDocument = gql`
    query UserPosts($handle: String!, $first: Int = 20, $after: String) {
  userPosts(handle: $handle, first: $first, after: $after) {
    edges {
      cursor
      node {
        ...PostFields
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
    ${PostFieldsFragmentDoc}`;

/**
 * __useUserPostsQuery__
 *
 * To run a query within a React component, call `useUserPostsQuery` and pass it any options that fit your needs.
 * When your component renders, `useUserPostsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUserPostsQuery({
 *   variables: {
 *      handle: // value for 'handle'
 *      first: // value for 'first'
 *      after: // value for 'after'
 *   },
 * });
 */
export function useUserPostsQuery(baseOptions: Apollo.QueryHookOptions<UserPostsQuery, UserPostsQueryVariables> & ({ variables: UserPostsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<UserPostsQuery, UserPostsQueryVariables>(UserPostsDocument, options);
      }
export function useUserPostsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<UserPostsQuery, UserPostsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<UserPostsQuery, UserPostsQueryVariables>(UserPostsDocument, options);
        }
// @ts-ignore
export function useUserPostsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<UserPostsQuery, UserPostsQueryVariables>): Apollo.UseSuspenseQueryResult<UserPostsQuery, UserPostsQueryVariables>;
export function useUserPostsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<UserPostsQuery, UserPostsQueryVariables>): Apollo.UseSuspenseQueryResult<UserPostsQuery | undefined, UserPostsQueryVariables>;
export function useUserPostsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<UserPostsQuery, UserPostsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<UserPostsQuery, UserPostsQueryVariables>(UserPostsDocument, options);
        }
export type UserPostsQueryHookResult = ReturnType<typeof useUserPostsQuery>;
export type UserPostsLazyQueryHookResult = ReturnType<typeof useUserPostsLazyQuery>;
export type UserPostsSuspenseQueryHookResult = ReturnType<typeof useUserPostsSuspenseQuery>;
export type UserPostsQueryResult = Apollo.QueryResult<UserPostsQuery, UserPostsQueryVariables>;
export const CreatePostDocument = gql`
    mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    ...PostFields
  }
}
    ${PostFieldsFragmentDoc}`;
export type CreatePostMutationFn = Apollo.MutationFunction<CreatePostMutation, CreatePostMutationVariables>;

/**
 * __useCreatePostMutation__
 *
 * To run a mutation, you first call `useCreatePostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreatePostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createPostMutation, { data, loading, error }] = useCreatePostMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreatePostMutation(baseOptions?: Apollo.MutationHookOptions<CreatePostMutation, CreatePostMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreatePostMutation, CreatePostMutationVariables>(CreatePostDocument, options);
      }
export type CreatePostMutationHookResult = ReturnType<typeof useCreatePostMutation>;
export type CreatePostMutationResult = Apollo.MutationResult<CreatePostMutation>;
export type CreatePostMutationOptions = Apollo.BaseMutationOptions<CreatePostMutation, CreatePostMutationVariables>;
export const DeletePostDocument = gql`
    mutation DeletePost($postId: ID!) {
  deletePost(postId: $postId)
}
    `;
export type DeletePostMutationFn = Apollo.MutationFunction<DeletePostMutation, DeletePostMutationVariables>;

/**
 * __useDeletePostMutation__
 *
 * To run a mutation, you first call `useDeletePostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeletePostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deletePostMutation, { data, loading, error }] = useDeletePostMutation({
 *   variables: {
 *      postId: // value for 'postId'
 *   },
 * });
 */
export function useDeletePostMutation(baseOptions?: Apollo.MutationHookOptions<DeletePostMutation, DeletePostMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeletePostMutation, DeletePostMutationVariables>(DeletePostDocument, options);
      }
export type DeletePostMutationHookResult = ReturnType<typeof useDeletePostMutation>;
export type DeletePostMutationResult = Apollo.MutationResult<DeletePostMutation>;
export type DeletePostMutationOptions = Apollo.BaseMutationOptions<DeletePostMutation, DeletePostMutationVariables>;
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
export const SearchUsersDocument = gql`
    query SearchUsers($query: String!, $first: Int = 20, $after: String) {
  searchUsers(query: $query, first: $first, after: $after) {
    edges {
      cursor
      node {
        ...UserSearchFields
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
    ${UserSearchFieldsFragmentDoc}`;

/**
 * __useSearchUsersQuery__
 *
 * To run a query within a React component, call `useSearchUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchUsersQuery({
 *   variables: {
 *      query: // value for 'query'
 *      first: // value for 'first'
 *      after: // value for 'after'
 *   },
 * });
 */
export function useSearchUsersQuery(baseOptions: Apollo.QueryHookOptions<SearchUsersQuery, SearchUsersQueryVariables> & ({ variables: SearchUsersQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SearchUsersQuery, SearchUsersQueryVariables>(SearchUsersDocument, options);
      }
export function useSearchUsersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SearchUsersQuery, SearchUsersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SearchUsersQuery, SearchUsersQueryVariables>(SearchUsersDocument, options);
        }
// @ts-ignore
export function useSearchUsersSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<SearchUsersQuery, SearchUsersQueryVariables>): Apollo.UseSuspenseQueryResult<SearchUsersQuery, SearchUsersQueryVariables>;
export function useSearchUsersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SearchUsersQuery, SearchUsersQueryVariables>): Apollo.UseSuspenseQueryResult<SearchUsersQuery | undefined, SearchUsersQueryVariables>;
export function useSearchUsersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SearchUsersQuery, SearchUsersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SearchUsersQuery, SearchUsersQueryVariables>(SearchUsersDocument, options);
        }
export type SearchUsersQueryHookResult = ReturnType<typeof useSearchUsersQuery>;
export type SearchUsersLazyQueryHookResult = ReturnType<typeof useSearchUsersLazyQuery>;
export type SearchUsersSuspenseQueryHookResult = ReturnType<typeof useSearchUsersSuspenseQuery>;
export type SearchUsersQueryResult = Apollo.QueryResult<SearchUsersQuery, SearchUsersQueryVariables>;
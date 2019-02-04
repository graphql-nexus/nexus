/* tslint:disable */

export namespace AccesstokensFields {
  export type id = string;
  export type token = string;
  export type userId = string;
  export type clientId = string;
  export type issuedBy = string | null;
  export type expires = number;
}

export interface Accesstokens {
  id: AccesstokensFields.id;
  token: AccesstokensFields.token;
  userId: AccesstokensFields.userId;
  clientId: AccesstokensFields.clientId;
  issuedBy: AccesstokensFields.issuedBy;
  expires: AccesstokensFields.expires;
}

export namespace ApiKeysFields {
  export type id = string;
  export type type = string;
  export type secret = string;
  export type roleId = string | null;
  export type integrationId = string | null;
  export type lastSeenAt = Date | null;
  export type lastSeenVersion = string | null;
  export type createdAt = Date;
  export type createdBy = string;
  export type updatedAt = Date | null;
  export type updatedBy = string | null;
}

export interface ApiKeys {
  id: ApiKeysFields.id;
  type: ApiKeysFields.type;
  secret: ApiKeysFields.secret;
  roleId: ApiKeysFields.roleId;
  integrationId: ApiKeysFields.integrationId;
  lastSeenAt: ApiKeysFields.lastSeenAt;
  lastSeenVersion: ApiKeysFields.lastSeenVersion;
  createdAt: ApiKeysFields.createdAt;
  createdBy: ApiKeysFields.createdBy;
  updatedAt: ApiKeysFields.updatedAt;
  updatedBy: ApiKeysFields.updatedBy;
}

export namespace AppFieldsFields {
  export type id = string;
  export type key = string;
  export type value = string | null;
  export type type = string;
  export type appId = string;
  export type relatableId = string;
  export type relatableType = string;
  export type active = boolean;
  export type createdAt = Date;
  export type createdBy = string;
  export type updatedAt = Date | null;
  export type updatedBy = string | null;
}

export interface AppFields {
  id: AppFieldsFields.id;
  key: AppFieldsFields.key;
  value: AppFieldsFields.value;
  type: AppFieldsFields.type;
  appId: AppFieldsFields.appId;
  relatableId: AppFieldsFields.relatableId;
  relatableType: AppFieldsFields.relatableType;
  active: AppFieldsFields.active;
  createdAt: AppFieldsFields.createdAt;
  createdBy: AppFieldsFields.createdBy;
  updatedAt: AppFieldsFields.updatedAt;
  updatedBy: AppFieldsFields.updatedBy;
}

export namespace AppSettingsFields {
  export type id = string;
  export type key = string;
  export type value = string | null;
  export type appId = string;
  export type createdAt = Date;
  export type createdBy = string;
  export type updatedAt = Date | null;
  export type updatedBy = string | null;
}

export interface AppSettings {
  id: AppSettingsFields.id;
  key: AppSettingsFields.key;
  value: AppSettingsFields.value;
  appId: AppSettingsFields.appId;
  createdAt: AppSettingsFields.createdAt;
  createdBy: AppSettingsFields.createdBy;
  updatedAt: AppSettingsFields.updatedAt;
  updatedBy: AppSettingsFields.updatedBy;
}

export namespace AppsFields {
  export type id = string;
  export type name = string;
  export type slug = string;
  export type version = string;
  export type status = string;
  export type createdAt = Date;
  export type createdBy = string;
  export type updatedAt = Date | null;
  export type updatedBy = string | null;
}

export interface Apps {
  id: AppsFields.id;
  name: AppsFields.name;
  slug: AppsFields.slug;
  version: AppsFields.version;
  status: AppsFields.status;
  createdAt: AppsFields.createdAt;
  createdBy: AppsFields.createdBy;
  updatedAt: AppsFields.updatedAt;
  updatedBy: AppsFields.updatedBy;
}

export namespace BruteFields {
  export type key = string;
  export type firstRequest = number;
  export type lastRequest = number;
  export type lifetime = number;
  export type count = number;
}

export interface Brute {
  key: BruteFields.key;
  firstRequest: BruteFields.firstRequest;
  lastRequest: BruteFields.lastRequest;
  lifetime: BruteFields.lifetime;
  count: BruteFields.count;
}

export namespace ClientTrustedDomainsFields {
  export type id = string;
  export type clientId = string;
  export type trustedDomain = string | null;
}

export interface ClientTrustedDomains {
  id: ClientTrustedDomainsFields.id;
  clientId: ClientTrustedDomainsFields.clientId;
  trustedDomain: ClientTrustedDomainsFields.trustedDomain;
}

export namespace ClientsFields {
  export type id = string;
  export type uuid = string;
  export type name = string;
  export type slug = string;
  export type secret = string;
  export type redirectionUri = string | null;
  export type clientUri = string | null;
  export type authUri = string | null;
  export type logo = string | null;
  export type status = string;
  export type type = string;
  export type description = string | null;
  export type createdAt = Date;
  export type createdBy = string;
  export type updatedAt = Date | null;
  export type updatedBy = string | null;
}

export interface Clients {
  id: ClientsFields.id;
  uuid: ClientsFields.uuid;
  name: ClientsFields.name;
  slug: ClientsFields.slug;
  secret: ClientsFields.secret;
  redirectionUri: ClientsFields.redirectionUri;
  clientUri: ClientsFields.clientUri;
  authUri: ClientsFields.authUri;
  logo: ClientsFields.logo;
  status: ClientsFields.status;
  type: ClientsFields.type;
  description: ClientsFields.description;
  createdAt: ClientsFields.createdAt;
  createdBy: ClientsFields.createdBy;
  updatedAt: ClientsFields.updatedAt;
  updatedBy: ClientsFields.updatedBy;
}

export namespace IntegrationsFields {
  export type id = string;
  export type name = string;
  export type slug = string;
  export type iconImage = string | null;
  export type description = string | null;
  export type createdAt = Date;
  export type createdBy = string;
  export type updatedAt = Date | null;
  export type updatedBy = string | null;
}

export interface Integrations {
  id: IntegrationsFields.id;
  name: IntegrationsFields.name;
  slug: IntegrationsFields.slug;
  iconImage: IntegrationsFields.iconImage;
  description: IntegrationsFields.description;
  createdAt: IntegrationsFields.createdAt;
  createdBy: IntegrationsFields.createdBy;
  updatedAt: IntegrationsFields.updatedAt;
  updatedBy: IntegrationsFields.updatedBy;
}

export namespace InvitesFields {
  export type id = string;
  export type roleId = string;
  export type status = string;
  export type token = string;
  export type email = string;
  export type expires = number;
  export type createdAt = Date;
  export type createdBy = string;
  export type updatedAt = Date | null;
  export type updatedBy = string | null;
}

export interface Invites {
  id: InvitesFields.id;
  roleId: InvitesFields.roleId;
  status: InvitesFields.status;
  token: InvitesFields.token;
  email: InvitesFields.email;
  expires: InvitesFields.expires;
  createdAt: InvitesFields.createdAt;
  createdBy: InvitesFields.createdBy;
  updatedAt: InvitesFields.updatedAt;
  updatedBy: InvitesFields.updatedBy;
}

export namespace MembersFields {
  export type id = string;
  export type email = string;
  export type name = string;
  export type password = string | null;
  export type createdAt = Date;
  export type createdBy = string;
  export type updatedAt = Date | null;
  export type updatedBy = string | null;
}

export interface Members {
  id: MembersFields.id;
  email: MembersFields.email;
  name: MembersFields.name;
  password: MembersFields.password;
  createdAt: MembersFields.createdAt;
  createdBy: MembersFields.createdBy;
  updatedAt: MembersFields.updatedAt;
  updatedBy: MembersFields.updatedBy;
}

export namespace MigrationsFields {
  export type id = number;
  export type name = string;
  export type version = string;
  export type currentVersion = string | null;
}

export interface Migrations {
  id: MigrationsFields.id;
  name: MigrationsFields.name;
  version: MigrationsFields.version;
  currentVersion: MigrationsFields.currentVersion;
}

export namespace MigrationsLockFields {
  export type lockKey = string;
  export type locked = boolean | null;
  export type acquiredAt = Date | null;
  export type releasedAt = Date | null;
}

export interface MigrationsLock {
  lockKey: MigrationsLockFields.lockKey;
  locked: MigrationsLockFields.locked;
  acquiredAt: MigrationsLockFields.acquiredAt;
  releasedAt: MigrationsLockFields.releasedAt;
}

export namespace MobiledocRevisionsFields {
  export type id = string;
  export type postId = string;
  export type mobiledoc = string | null;
  export type createdAtTs = number;
  export type createdAt = Date;
}

export interface MobiledocRevisions {
  id: MobiledocRevisionsFields.id;
  postId: MobiledocRevisionsFields.postId;
  mobiledoc: MobiledocRevisionsFields.mobiledoc;
  createdAtTs: MobiledocRevisionsFields.createdAtTs;
  createdAt: MobiledocRevisionsFields.createdAt;
}

export namespace PermissionsFields {
  export type id = string;
  export type name = string;
  export type objectType = string;
  export type actionType = string;
  export type objectId = string | null;
  export type createdAt = Date;
  export type createdBy = string;
  export type updatedAt = Date | null;
  export type updatedBy = string | null;
}

export interface Permissions {
  id: PermissionsFields.id;
  name: PermissionsFields.name;
  objectType: PermissionsFields.objectType;
  actionType: PermissionsFields.actionType;
  objectId: PermissionsFields.objectId;
  createdAt: PermissionsFields.createdAt;
  createdBy: PermissionsFields.createdBy;
  updatedAt: PermissionsFields.updatedAt;
  updatedBy: PermissionsFields.updatedBy;
}

export namespace PermissionsAppsFields {
  export type id = string;
  export type appId = string;
  export type permissionId = string;
}

export interface PermissionsApps {
  id: PermissionsAppsFields.id;
  appId: PermissionsAppsFields.appId;
  permissionId: PermissionsAppsFields.permissionId;
}

export namespace PermissionsRolesFields {
  export type id = string;
  export type roleId = string;
  export type permissionId = string;
}

export interface PermissionsRoles {
  id: PermissionsRolesFields.id;
  roleId: PermissionsRolesFields.roleId;
  permissionId: PermissionsRolesFields.permissionId;
}

export namespace PermissionsUsersFields {
  export type id = string;
  export type userId = string;
  export type permissionId = string;
}

export interface PermissionsUsers {
  id: PermissionsUsersFields.id;
  userId: PermissionsUsersFields.userId;
  permissionId: PermissionsUsersFields.permissionId;
}

export namespace PostsFields {
  export type id = string;
  export type uuid = string;
  export type title = string;
  export type slug = string;
  export type mobiledoc = string | null;
  export type html = string | null;
  export type commentId = string | null;
  export type plaintext = string | null;
  export type featureImage = string | null;
  export type featured = boolean;
  export type page = boolean;
  export type status = string;
  export type locale = string | null;
  export type visibility = string;
  export type metaTitle = string | null;
  export type metaDescription = string | null;
  export type authorId = string;
  export type createdAt = Date;
  export type createdBy = string;
  export type updatedAt = Date | null;
  export type updatedBy = string | null;
  export type publishedAt = Date | null;
  export type publishedBy = string | null;
  export type customExcerpt = string | null;
  export type codeinjectionHead = string | null;
  export type codeinjectionFoot = string | null;
  export type ogImage = string | null;
  export type ogTitle = string | null;
  export type ogDescription = string | null;
  export type twitterImage = string | null;
  export type twitterTitle = string | null;
  export type twitterDescription = string | null;
  export type customTemplate = string | null;
}

export interface Posts {
  id: PostsFields.id;
  uuid: PostsFields.uuid;
  title: PostsFields.title;
  slug: PostsFields.slug;
  mobiledoc: PostsFields.mobiledoc;
  html: PostsFields.html;
  commentId: PostsFields.commentId;
  plaintext: PostsFields.plaintext;
  featureImage: PostsFields.featureImage;
  featured: PostsFields.featured;
  page: PostsFields.page;
  status: PostsFields.status;
  locale: PostsFields.locale;
  visibility: PostsFields.visibility;
  metaTitle: PostsFields.metaTitle;
  metaDescription: PostsFields.metaDescription;
  authorId: PostsFields.authorId;
  createdAt: PostsFields.createdAt;
  createdBy: PostsFields.createdBy;
  updatedAt: PostsFields.updatedAt;
  updatedBy: PostsFields.updatedBy;
  publishedAt: PostsFields.publishedAt;
  publishedBy: PostsFields.publishedBy;
  customExcerpt: PostsFields.customExcerpt;
  codeinjectionHead: PostsFields.codeinjectionHead;
  codeinjectionFoot: PostsFields.codeinjectionFoot;
  ogImage: PostsFields.ogImage;
  ogTitle: PostsFields.ogTitle;
  ogDescription: PostsFields.ogDescription;
  twitterImage: PostsFields.twitterImage;
  twitterTitle: PostsFields.twitterTitle;
  twitterDescription: PostsFields.twitterDescription;
  customTemplate: PostsFields.customTemplate;
}

export namespace PostsAuthorsFields {
  export type id = string;
  export type postId = string;
  export type authorId = string;
  export type sortOrder = number;
}

export interface PostsAuthors {
  id: PostsAuthorsFields.id;
  postId: PostsAuthorsFields.postId;
  authorId: PostsAuthorsFields.authorId;
  sortOrder: PostsAuthorsFields.sortOrder;
}

export namespace PostsTagsFields {
  export type id = string;
  export type postId = string;
  export type tagId = string;
  export type sortOrder = number;
}

export interface PostsTags {
  id: PostsTagsFields.id;
  postId: PostsTagsFields.postId;
  tagId: PostsTagsFields.tagId;
  sortOrder: PostsTagsFields.sortOrder;
}

export namespace RefreshtokensFields {
  export type id = string;
  export type token = string;
  export type userId = string;
  export type clientId = string;
  export type expires = number;
}

export interface Refreshtokens {
  id: RefreshtokensFields.id;
  token: RefreshtokensFields.token;
  userId: RefreshtokensFields.userId;
  clientId: RefreshtokensFields.clientId;
  expires: RefreshtokensFields.expires;
}

export namespace RolesFields {
  export type id = string;
  export type name = string;
  export type description = string | null;
  export type createdAt = Date;
  export type createdBy = string;
  export type updatedAt = Date | null;
  export type updatedBy = string | null;
}

export interface Roles {
  id: RolesFields.id;
  name: RolesFields.name;
  description: RolesFields.description;
  createdAt: RolesFields.createdAt;
  createdBy: RolesFields.createdBy;
  updatedAt: RolesFields.updatedAt;
  updatedBy: RolesFields.updatedBy;
}

export namespace RolesUsersFields {
  export type id = string;
  export type roleId = string;
  export type userId = string;
}

export interface RolesUsers {
  id: RolesUsersFields.id;
  roleId: RolesUsersFields.roleId;
  userId: RolesUsersFields.userId;
}

export namespace SessionsFields {
  export type id = string;
  export type sessionId = string;
  export type userId = string;
  export type sessionData = string;
  export type createdAt = Date;
  export type updatedAt = Date | null;
}

export interface Sessions {
  id: SessionsFields.id;
  sessionId: SessionsFields.sessionId;
  userId: SessionsFields.userId;
  sessionData: SessionsFields.sessionData;
  createdAt: SessionsFields.createdAt;
  updatedAt: SessionsFields.updatedAt;
}

export namespace SettingsFields {
  export type id = string;
  export type key = string;
  export type value = string | null;
  export type type = string;
  export type createdAt = Date;
  export type createdBy = string;
  export type updatedAt = Date | null;
  export type updatedBy = string | null;
}

export interface Settings {
  id: SettingsFields.id;
  key: SettingsFields.key;
  value: SettingsFields.value;
  type: SettingsFields.type;
  createdAt: SettingsFields.createdAt;
  createdBy: SettingsFields.createdBy;
  updatedAt: SettingsFields.updatedAt;
  updatedBy: SettingsFields.updatedBy;
}

export namespace SubscribersFields {
  export type id = string;
  export type name = string | null;
  export type email = string;
  export type status = string;
  export type postId = string | null;
  export type subscribedUrl = string | null;
  export type subscribedReferrer = string | null;
  export type unsubscribedUrl = string | null;
  export type unsubscribedAt = Date | null;
  export type createdAt = Date;
  export type createdBy = string;
  export type updatedAt = Date | null;
  export type updatedBy = string | null;
}

export interface Subscribers {
  id: SubscribersFields.id;
  name: SubscribersFields.name;
  email: SubscribersFields.email;
  status: SubscribersFields.status;
  postId: SubscribersFields.postId;
  subscribedUrl: SubscribersFields.subscribedUrl;
  subscribedReferrer: SubscribersFields.subscribedReferrer;
  unsubscribedUrl: SubscribersFields.unsubscribedUrl;
  unsubscribedAt: SubscribersFields.unsubscribedAt;
  createdAt: SubscribersFields.createdAt;
  createdBy: SubscribersFields.createdBy;
  updatedAt: SubscribersFields.updatedAt;
  updatedBy: SubscribersFields.updatedBy;
}

export namespace TagsFields {
  export type id = string;
  export type name = string;
  export type slug = string;
  export type description = string | null;
  export type featureImage = string | null;
  export type parentId = string | null;
  export type visibility = string;
  export type metaTitle = string | null;
  export type metaDescription = string | null;
  export type createdAt = Date;
  export type createdBy = string;
  export type updatedAt = Date | null;
  export type updatedBy = string | null;
}

export interface Tags {
  id: TagsFields.id;
  name: TagsFields.name;
  slug: TagsFields.slug;
  description: TagsFields.description;
  featureImage: TagsFields.featureImage;
  parentId: TagsFields.parentId;
  visibility: TagsFields.visibility;
  metaTitle: TagsFields.metaTitle;
  metaDescription: TagsFields.metaDescription;
  createdAt: TagsFields.createdAt;
  createdBy: TagsFields.createdBy;
  updatedAt: TagsFields.updatedAt;
  updatedBy: TagsFields.updatedBy;
}

export namespace UsersFields {
  export type id = string;
  export type name = string;
  export type slug = string;
  export type ghostAuthAccessToken = string | null;
  export type ghostAuthId = string | null;
  export type password = string;
  export type email = string;
  export type profileImage = string | null;
  export type coverImage = string | null;
  export type bio = string | null;
  export type website = string | null;
  export type location = string | null;
  export type facebook = string | null;
  export type twitter = string | null;
  export type accessibility = string | null;
  export type status = string;
  export type locale = string | null;
  export type visibility = string;
  export type metaTitle = string | null;
  export type metaDescription = string | null;
  export type tour = string | null;
  export type lastSeen = Date | null;
  export type createdAt = Date;
  export type createdBy = string;
  export type updatedAt = Date | null;
  export type updatedBy = string | null;
}

export interface Users {
  id: UsersFields.id;
  name: UsersFields.name;
  slug: UsersFields.slug;
  ghostAuthAccessToken: UsersFields.ghostAuthAccessToken;
  ghostAuthId: UsersFields.ghostAuthId;
  password: UsersFields.password;
  email: UsersFields.email;
  profileImage: UsersFields.profileImage;
  coverImage: UsersFields.coverImage;
  bio: UsersFields.bio;
  website: UsersFields.website;
  location: UsersFields.location;
  facebook: UsersFields.facebook;
  twitter: UsersFields.twitter;
  accessibility: UsersFields.accessibility;
  status: UsersFields.status;
  locale: UsersFields.locale;
  visibility: UsersFields.visibility;
  metaTitle: UsersFields.metaTitle;
  metaDescription: UsersFields.metaDescription;
  tour: UsersFields.tour;
  lastSeen: UsersFields.lastSeen;
  createdAt: UsersFields.createdAt;
  createdBy: UsersFields.createdBy;
  updatedAt: UsersFields.updatedAt;
  updatedBy: UsersFields.updatedBy;
}

export namespace WebhooksFields {
  export type id = string;
  export type event = string;
  export type targetUrl = string;
  export type name = string | null;
  export type secret = string | null;
  export type apiVersion = string;
  export type integrationId = string | null;
  export type status = string;
  export type lastTriggeredAt = Date | null;
  export type lastTriggeredStatus = string | null;
  export type lastTriggeredError = string | null;
  export type createdAt = Date;
  export type createdBy = string;
  export type updatedAt = Date | null;
  export type updatedBy = string | null;
}

export interface Webhooks {
  id: WebhooksFields.id;
  event: WebhooksFields.event;
  targetUrl: WebhooksFields.targetUrl;
  name: WebhooksFields.name;
  secret: WebhooksFields.secret;
  apiVersion: WebhooksFields.apiVersion;
  integrationId: WebhooksFields.integrationId;
  status: WebhooksFields.status;
  lastTriggeredAt: WebhooksFields.lastTriggeredAt;
  lastTriggeredStatus: WebhooksFields.lastTriggeredStatus;
  lastTriggeredError: WebhooksFields.lastTriggeredError;
  createdAt: WebhooksFields.createdAt;
  createdBy: WebhooksFields.createdBy;
  updatedAt: WebhooksFields.updatedAt;
  updatedBy: WebhooksFields.updatedBy;
}

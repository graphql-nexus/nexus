/* tslint:disable */

export interface Actions {
  actorId: string
  actorType: string
  context: string | null
  createdAt: Date
  event: string
  id: string
  resourceId: string | null
  resourceType: string
}

export interface ApiKeys {
  createdAt: Date
  createdBy: string
  id: string
  integrationId: string | null
  lastSeenAt: Date | null
  lastSeenVersion: string | null
  roleId: string | null
  secret: string
  type: string
  updatedAt: Date | null
  updatedBy: string | null
}

export interface AppFields {
  active: boolean
  appId: string
  createdAt: Date
  createdBy: string
  id: string
  key: string
  relatableId: string
  relatableType: string
  type: string
  updatedAt: Date | null
  updatedBy: string | null
  value: string | null
}

export interface AppSettings {
  appId: string
  createdAt: Date
  createdBy: string
  id: string
  key: string
  updatedAt: Date | null
  updatedBy: string | null
  value: string | null
}

export interface Apps {
  createdAt: Date
  createdBy: string
  id: string
  name: string
  slug: string
  status: string
  updatedAt: Date | null
  updatedBy: string | null
  version: string
}

export interface Brute {
  count: number
  firstRequest: number
  key: string
  lastRequest: number
  lifetime: number
}

export interface EmailBatches {
  createdAt: Date
  emailId: string
  id: string
  providerId: string | null
  status: string
  updatedAt: Date
}

export interface EmailRecipients {
  batchId: string
  emailId: string
  id: string
  memberEmail: string
  memberId: string
  memberName: string | null
  memberUuid: string
  processedAt: Date | null
}

export interface Emails {
  createdAt: Date
  createdBy: string
  emailCount: number
  error: string | null
  errorData: string | null
  from: string | null
  html: string | null
  id: string
  meta: string | null
  plaintext: string | null
  postId: string
  replyTo: string | null
  stats: string | null
  status: string
  subject: string | null
  submittedAt: Date
  updatedAt: Date | null
  updatedBy: string | null
  uuid: string
}

export interface Integrations {
  createdAt: Date
  createdBy: string
  description: string | null
  iconImage: string | null
  id: string
  name: string
  slug: string
  type: string
  updatedAt: Date | null
  updatedBy: string | null
}

export interface Invites {
  createdAt: Date
  createdBy: string
  email: string
  expires: number
  id: string
  roleId: string
  status: string
  token: string
  updatedAt: Date | null
  updatedBy: string | null
}

export interface Labels {
  createdAt: Date
  createdBy: string
  id: string
  name: string
  slug: string
  updatedAt: Date | null
  updatedBy: string | null
}

export interface Members {
  createdAt: Date
  createdBy: string
  email: string
  geolocation: string | null
  id: string
  name: string | null
  note: string | null
  subscribed: boolean | null
  updatedAt: Date | null
  updatedBy: string | null
  uuid: string | null
}

export interface MembersLabels {
  id: string
  labelId: string
  memberId: string
  sortOrder: number
}

export interface MembersStripeCustomers {
  createdAt: Date
  createdBy: string
  customerId: string
  email: string | null
  id: string
  memberId: string
  name: string | null
  updatedAt: Date | null
  updatedBy: string | null
}

export interface MembersStripeCustomersSubscriptions {
  cancelAtPeriodEnd: boolean
  createdAt: Date
  createdBy: string
  currentPeriodEnd: Date
  customerId: string
  defaultPaymentCardLast4: string | null
  id: string
  planAmount: number
  planCurrency: string
  planId: string
  planInterval: string
  planNickname: string
  startDate: Date
  status: string
  subscriptionId: string
  updatedAt: Date | null
  updatedBy: string | null
}

export interface Migrations {
  currentVersion: string | null
  id: number
  name: string
  version: string
}

export interface MigrationsLock {
  acquiredAt: Date | null
  lockKey: string
  locked: boolean | null
  releasedAt: Date | null
}

export interface MobiledocRevisions {
  createdAt: Date
  createdAtTs: number
  id: string
  mobiledoc: string | null
  postId: string
}

export interface Permissions {
  actionType: string
  createdAt: Date
  createdBy: string
  id: string
  name: string
  objectId: string | null
  objectType: string
  updatedAt: Date | null
  updatedBy: string | null
}

export interface PermissionsApps {
  appId: string
  id: string
  permissionId: string
}

export interface PermissionsRoles {
  id: string
  permissionId: string
  roleId: string
}

export interface PermissionsUsers {
  id: string
  permissionId: string
  userId: string
}

export interface Posts {
  authorId: string
  canonicalUrl: string | null
  codeinjectionFoot: string | null
  codeinjectionHead: string | null
  commentId: string | null
  createdAt: Date
  createdBy: string
  customExcerpt: string | null
  customTemplate: string | null
  featureImage: string | null
  featured: boolean
  html: string | null
  id: string
  locale: string | null
  mobiledoc: string | null
  plaintext: string | null
  publishedAt: Date | null
  publishedBy: string | null
  sendEmailWhenPublished: boolean | null
  slug: string
  status: string
  title: string
  type: string
  updatedAt: Date | null
  updatedBy: string | null
  uuid: string
  visibility: string
}

export interface PostsAuthors {
  authorId: string
  id: string
  postId: string
  sortOrder: number
}

export interface PostsMeta {
  emailSubject: string | null
  id: string
  metaDescription: string | null
  metaTitle: string | null
  ogDescription: string | null
  ogImage: string | null
  ogTitle: string | null
  postId: string
  twitterDescription: string | null
  twitterImage: string | null
  twitterTitle: string | null
}

export interface PostsTags {
  id: string
  postId: string
  sortOrder: number
  tagId: string
}

export interface Roles {
  createdAt: Date
  createdBy: string
  description: string | null
  id: string
  name: string
  updatedAt: Date | null
  updatedBy: string | null
}

export interface RolesUsers {
  id: string
  roleId: string
  userId: string
}

export interface Sessions {
  createdAt: Date
  id: string
  sessionData: string
  sessionId: string
  updatedAt: Date | null
  userId: string
}

export interface Settings {
  createdAt: Date
  createdBy: string
  flags: string | null
  group: string
  id: string
  key: string
  type: string
  updatedAt: Date | null
  updatedBy: string | null
  value: string | null
}

export interface Tags {
  accentColor: string | null
  canonicalUrl: string | null
  codeinjectionFoot: string | null
  codeinjectionHead: string | null
  createdAt: Date
  createdBy: string
  description: string | null
  featureImage: string | null
  id: string
  metaDescription: string | null
  metaTitle: string | null
  name: string
  ogDescription: string | null
  ogImage: string | null
  ogTitle: string | null
  parentId: string | null
  slug: string
  twitterDescription: string | null
  twitterImage: string | null
  twitterTitle: string | null
  updatedAt: Date | null
  updatedBy: string | null
  visibility: string
}

export interface Tokens {
  createdAt: Date
  createdBy: string
  data: string | null
  id: string
  token: string
}

export interface Users {
  accessibility: string | null
  bio: string | null
  coverImage: string | null
  createdAt: Date
  createdBy: string
  email: string
  facebook: string | null
  id: string
  lastSeen: Date | null
  locale: string | null
  location: string | null
  metaDescription: string | null
  metaTitle: string | null
  name: string
  password: string
  profileImage: string | null
  slug: string
  status: string
  tour: string | null
  twitter: string | null
  updatedAt: Date | null
  updatedBy: string | null
  visibility: string
  website: string | null
}

export interface Webhooks {
  apiVersion: string
  createdAt: Date
  createdBy: string
  event: string
  id: string
  integrationId: string | null
  lastTriggeredAt: Date | null
  lastTriggeredError: string | null
  lastTriggeredStatus: string | null
  name: string | null
  secret: string | null
  status: string
  targetUrl: string
  updatedAt: Date | null
  updatedBy: string | null
}

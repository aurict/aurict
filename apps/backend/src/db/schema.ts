import { sql } from "drizzle-orm"
import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core"

export * from "../legal/schema"

export const devicePlatform = pgEnum("device_platform", ["mobile", "cli", "desktop", "web"])
export const trustScope = pgEnum("trust_scope", ["remote", "secret_transfer", "all"])
export const remoteStatus = pgEnum("remote_status", ["available", "accepted", "closed", "expired"])
export const connectionMode = pgEnum("connection_mode", ["webrtc", "tunnel", "lan"])
export const authTokenPurpose = pgEnum("auth_token_purpose", ["email_verification", "password_reset"])

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  emailVerifiedAt: timestamp("email_verified_at"),
  createdAt: timestamp("created_at").notNull(),
  disabledAt: timestamp("disabled_at"),
  tokensValidAfter: timestamp("tokens_valid_after"),
}, (table) => ({
  emailIdx: uniqueIndex("users_email_idx").on(table.email),
}))

export const userPresence = pgTable("user_presence", {
  userId: text("user_id").primaryKey().references(() => users.id),
  lastSeenAt: timestamp("last_seen_at").notNull(),
}, (table) => ({
  lastSeenIdx: index("user_presence_last_seen_idx").on(table.lastSeenAt),
}))

export const authIdentities = pgTable("auth_identities", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull(),
  providerSubject: text("provider_subject"),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at").notNull(),
}, (table) => ({
  userProviderIdx: uniqueIndex("auth_user_provider_idx").on(table.userId, table.provider),
  providerSubjectIdx: uniqueIndex("auth_provider_subject_idx").on(table.provider, table.providerSubject),
}))

export const refreshTokens = pgTable("refresh_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  deviceId: text("device_id"),
  tokenHash: text("token_hash").notNull(),
  familyId: text("family_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  replacedByTokenId: text("replaced_by_token_id"),
  reuseDetectedAt: timestamp("reuse_detected_at"),
  createdAt: timestamp("created_at").notNull(),
}, (table) => ({
  tokenHashIdx: uniqueIndex("refresh_token_hash_idx").on(table.tokenHash),
  userIdx: index("refresh_user_idx").on(table.userId),
}))

export const authTokens = pgTable("auth_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  purpose: authTokenPurpose("purpose").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  consumedAt: timestamp("consumed_at"),
  createdAt: timestamp("created_at").notNull(),
}, (table) => ({
  tokenHashIdx: uniqueIndex("auth_token_hash_idx").on(table.tokenHash),
  userPurposeIdx: index("auth_token_user_purpose_idx").on(table.userId, table.purpose),
}))

export const deviceLoginFlows = pgTable("device_login_flows", {
  id: text("id").primaryKey(),
  deviceCodeHash: text("device_code_hash").notNull(),
  userCodeHash: text("user_code_hash").notNull(),
  clientName: text("client_name").notNull(),
  platform: text("platform").notNull().default("cli"),
  expiresAt: timestamp("expires_at").notNull(),
  approvedUserId: text("approved_user_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  deniedAt: timestamp("denied_at"),
  consumedAt: timestamp("consumed_at"),
  lastPolledAt: timestamp("last_polled_at"),
  // Coarse origin of the request (IPv4 /24 or IPv6 /64, and the Cloudflare country), shown on
  // the approval page so the user can tell whether the login started on their own machine.
  requesterNetwork: text("requester_network"),
  requesterCountry: text("requester_country"),
  createdAt: timestamp("created_at").notNull(),
}, (table) => ({
  deviceCodeHashIdx: uniqueIndex("device_login_device_code_hash_idx").on(table.deviceCodeHash),
  userCodeHashIdx: uniqueIndex("device_login_user_code_hash_idx").on(table.userCodeHash),
  expiryIdx: index("device_login_expiry_idx").on(table.expiresAt),
}))

export const devices = pgTable("devices", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  platform: devicePlatform("platform").notNull(),
  encryptionPublicKey: text("encryption_public_key").notNull(),
  signingPublicKey: text("signing_public_key").notNull(),
  signingKeyFingerprint: text("signing_key_fingerprint").notNull(),
  registrationChallenge: text("registration_challenge"),
  registrationChallengeExpiresAt: timestamp("registration_challenge_expires_at"),
  verifiedAt: timestamp("verified_at"),
  lastSeenAt: timestamp("last_seen_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").notNull(),
}, (table) => ({
  userIdx: index("devices_user_idx").on(table.userId),
  fingerprintIdx: uniqueIndex("devices_active_fingerprint_idx")
    .on(table.signingKeyFingerprint)
    .where(sql`${table.revokedAt} is null`),
}))

export const deviceTrusts = pgTable("device_trusts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  sourceDeviceId: text("source_device_id").notNull().references(() => devices.id),
  targetDeviceId: text("target_device_id").notNull().references(() => devices.id),
  scope: trustScope("scope").notNull(),
  createdAt: timestamp("created_at").notNull(),
  revokedAt: timestamp("revoked_at"),
}, (table) => ({
  pairIdx: index("device_trust_pair_idx").on(table.userId, table.sourceDeviceId, table.targetDeviceId),
}))

export const secretTransfers = pgTable("secret_transfers", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  senderDeviceId: text("sender_device_id").notNull().references(() => devices.id),
  recipientDeviceId: text("recipient_device_id").notNull().references(() => devices.id),
  provider: text("provider").notNull(),
  envelopeVersion: text("envelope_version").notNull().default("1"),
  ciphertext: text("ciphertext").notNull(),
  nonce: text("nonce").notNull(),
  algorithm: text("algorithm").notNull(),
  recipientKeyFingerprint: text("recipient_key_fingerprint").notNull(),
  senderKeyFingerprint: text("sender_key_fingerprint").notNull().default(""),
  senderSignature: text("sender_signature").notNull().default(""),
  expiresAt: timestamp("expires_at").notNull(),
  claimedAt: timestamp("claimed_at"),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").notNull(),
}, (table) => ({
  inboxIdx: index("secret_transfer_inbox_idx").on(table.userId, table.recipientDeviceId),
}))

export const remoteSessions = pgTable("remote_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  desktopDeviceId: text("desktop_device_id").notNull().references(() => devices.id),
  protocolVersion: integer("protocol_version").notNull().default(1),
  status: remoteStatus("status").notNull(),
  connectionMode: connectionMode("connection_mode").notNull(),
  signedOffer: text("signed_offer").notNull(),
  acceptedByDeviceId: text("accepted_by_device_id"),
  signedAnswer: text("signed_answer"),
  resumeTokenHash: text("resume_token_hash"),
  lastSequence: integer("last_sequence").notNull().default(0),
  maxIdleSeconds: integer("max_idle_seconds").notNull().default(90),
  expiresAt: timestamp("expires_at").notNull(),
  lastHeartbeatAt: timestamp("last_heartbeat_at").notNull(),
  createdAt: timestamp("created_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  closedAt: timestamp("closed_at"),
}, (table) => ({
  userStatusIdx: index("remote_user_status_idx").on(table.userId, table.status),
}))

export const feedbackReports = pgTable("feedback_reports", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  note: text("note"),
  userMessage: text("user_message"),
  assistantMessage: text("assistant_message").notNull(),
  provider: text("provider"),
  model: text("model"),
  appVersion: text("app_version"),
  platform: text("platform").notNull().default("mobile"),
  toolSummaryJson: text("tool_summary_json").notNull(),
  metadataJson: text("metadata_json").notNull(),
  createdAt: timestamp("created_at").notNull(),
}, (table) => ({
  userCreatedIdx: index("feedback_reports_user_created_idx").on(table.userId, table.createdAt),
  reasonIdx: index("feedback_reports_reason_idx").on(table.reason),
}))

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  deviceId: text("device_id"),
  event: text("event").notNull(),
  metadataJson: text("metadata_json").notNull(),
  ipHash: text("ip_hash"),
  createdAt: timestamp("created_at").notNull(),
})

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  resetAt: timestamp("reset_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
})

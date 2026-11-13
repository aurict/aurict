export type User = {
  id: string
  email: string
  emailVerifiedAt?: Date
  createdAt: Date
  disabledAt?: Date
  /** Access tokens issued (iat) before this instant are rejected. */
  tokensValidAfter?: Date
}

export type AuthProvider = "password" | "firebase" | "google" | "apple"

export type AuthIdentity = {
  id: string
  userId: string
  provider: AuthProvider
  providerSubject?: string
  passwordHash?: string
  createdAt: Date
}

export type AuthTokenPurpose = "email_verification" | "password_reset"

export type AuthTokenRecord = {
  id: string
  userId: string
  purpose: AuthTokenPurpose
  tokenHash: string
  expiresAt: Date
  consumedAt?: Date
  createdAt: Date
}

export type DeviceLoginFlow = {
  id: string
  deviceCodeHash: string
  userCodeHash: string
  clientName: string
  platform: "cli"
  expiresAt: Date
  approvedUserId?: string
  approvedAt?: Date
  deniedAt?: Date
  consumedAt?: Date
  lastPolledAt?: Date
  requesterNetwork?: string
  requesterCountry?: string
  createdAt: Date
}

export type RefreshTokenRecord = {
  id: string
  userId: string
  deviceId?: string
  tokenHash: string
  familyId: string
  expiresAt: Date
  revokedAt?: Date
  replacedByTokenId?: string
  reuseDetectedAt?: Date
  createdAt: Date
}

export type DevicePlatform = "mobile" | "cli" | "desktop" | "web"
export type TrustScope = "remote" | "secret_transfer" | "all"
export type RemoteStatus = "available" | "accepted" | "closed" | "expired"
export type ConnectionMode = "webrtc" | "tunnel" | "lan"

export type Device = {
  id: string
  userId: string
  name: string
  platform: DevicePlatform
  encryptionPublicKey: string
  signingPublicKey: string
  signingKeyFingerprint: string
  registrationChallenge?: string
  registrationChallengeExpiresAt?: Date
  verifiedAt?: Date
  lastSeenAt: Date
  revokedAt?: Date
  createdAt: Date
}

export type DeviceTrust = {
  id: string
  userId: string
  sourceDeviceId: string
  targetDeviceId: string
  scope: TrustScope
  createdAt: Date
  revokedAt?: Date
}

export type SecretTransfer = {
  id: string
  userId: string
  senderDeviceId: string
  recipientDeviceId: string
  provider: string
  envelopeVersion: number
  ciphertext: string
  nonce: string
  algorithm: string
  recipientKeyFingerprint: string
  senderKeyFingerprint: string
  senderSignature: string
  expiresAt: Date
  claimedAt?: Date
  revokedAt?: Date
  createdAt: Date
}

export type RemoteSession = {
  id: string
  userId: string
  desktopDeviceId: string
  protocolVersion: number
  status: RemoteStatus
  connectionMode: ConnectionMode
  signedOffer: string
  acceptedByDeviceId?: string
  signedAnswer?: string
  resumeTokenHash?: string
  lastSequence: number
  maxIdleSeconds: number
  expiresAt: Date
  lastHeartbeatAt: Date
  createdAt: Date
  acceptedAt?: Date
  closedAt?: Date
}

export type FeedbackReportReason =
  | "incorrect"
  | "unsafe"
  | "hallucination"
  | "formatting"
  | "tool_issue"
  | "other"

export type FeedbackReport = {
  id: string
  userId: string
  reason: FeedbackReportReason
  note?: string
  userMessage?: string
  assistantMessage: string
  provider?: string
  model?: string
  appVersion?: string
  platform: "mobile"
  toolSummaryJson: string
  metadataJson: string
  createdAt: Date
}

export type AuditLog = {
  id: string
  userId?: string
  deviceId?: string
  event: string
  metadataJson: string
  ipHash?: string
  createdAt: Date
}

export type BackendStore = {
  users: Map<string, User>
  usersByEmail: Map<string, string>
  userPresence: Map<string, Date>
  identities: Map<string, AuthIdentity>
  refreshTokens: Map<string, RefreshTokenRecord>
  refreshTokensByHash: Map<string, string>
  authTokens: Map<string, AuthTokenRecord>
  authTokensByHash: Map<string, string>
  deviceLoginFlows: Map<string, DeviceLoginFlow>
  deviceLoginFlowsByDeviceCodeHash: Map<string, string>
  deviceLoginFlowsByUserCodeHash: Map<string, string>
  devices: Map<string, Device>
  trusts: Map<string, DeviceTrust>
  secretTransfers: Map<string, SecretTransfer>
  remoteSessions: Map<string, RemoteSession>
  feedbackReports: Map<string, FeedbackReport>
  auditLogs: AuditLog[]
}

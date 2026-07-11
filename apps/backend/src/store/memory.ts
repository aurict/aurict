import type { BackendStore } from "./types"

export function createMemoryStore(): BackendStore {
  return {
    users: new Map(),
    usersByEmail: new Map(),
    identities: new Map(),
    refreshTokens: new Map(),
    refreshTokensByHash: new Map(),
    authTokens: new Map(),
    authTokensByHash: new Map(),
    deviceLoginFlows: new Map(),
    deviceLoginFlowsByDeviceCodeHash: new Map(),
    deviceLoginFlowsByUserCodeHash: new Map(),
    devices: new Map(),
    trusts: new Map(),
    secretTransfers: new Map(),
    remoteSessions: new Map(),
    feedbackReports: new Map(),
    auditLogs: [],
  }
}

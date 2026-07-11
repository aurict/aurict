import type { Device } from "./types"

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function publicDevice(device: Device) {
  return {
    id: device.id,
    name: device.name,
    platform: device.platform,
    encryptionPublicKey: device.encryptionPublicKey,
    signingPublicKey: device.signingPublicKey,
    signingKeyFingerprint: device.signingKeyFingerprint,
    verificationStatus: device.verifiedAt ? "verified" : "pending",
    verifiedAt: device.verifiedAt?.toISOString(),
    registrationChallengeExpiresAt: device.registrationChallengeExpiresAt?.toISOString(),
    lastSeenAt: device.lastSeenAt.toISOString(),
    revokedAt: device.revokedAt?.toISOString(),
    createdAt: device.createdAt.toISOString(),
  }
}

export function isDeviceActive(device: Device | undefined): device is Device {
  return !!device && !device.revokedAt
}

export function containsPlaintextSecret(value: unknown): boolean {
  if (typeof value === "string") return /\b(sk-|sk_live|api[_-]?key|secret|bearer\s+)/i.test(value)
  if (Array.isArray(value)) return value.some(containsPlaintextSecret)
  if (value && typeof value === "object") {
    return Object.entries(value).some(([key, nested]) => {
      if (/^(apiKey|api_key|secret|plaintext|token|providerKey)$/i.test(key)) return true
      return containsPlaintextSecret(nested)
    })
  }
  return false
}

export function containsRemotePayload(value: unknown): boolean {
  if (!value || typeof value !== "object") return false
  return Object.keys(value as Record<string, unknown>).some((key) =>
    /^(prompt|command|terminalOutput|output|toolResult|fileContent|message)$/i.test(key),
  )
}

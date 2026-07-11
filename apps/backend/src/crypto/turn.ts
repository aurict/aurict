import type { BackendEnv } from "../env"

const encoder = new TextEncoder()

export async function createTurnCredential(env: BackendEnv, userId: string, sessionId: string) {
  if (!env.TURN_SHARED_SECRET || !env.TURN_URIS.trim()) return undefined
  const expiresAtSeconds = Math.floor(Date.now() / 1000) + env.TURN_USERNAME_TTL_SECONDS
  const username = `${expiresAtSeconds}:aurict:${userId}:${sessionId}`
  const credential = await hmacSha1Base64(username, env.TURN_SHARED_SECRET)
  return {
    urls: env.TURN_URIS.split(",").map((uri) => uri.trim()).filter(Boolean),
    username,
    credential,
    credentialType: "password" as const,
    expiresAt: new Date(expiresAtSeconds * 1000),
  }
}

async function hmacSha1Base64(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value))
  return Buffer.from(signature).toString("base64")
}

import type { BackendEnv } from "../env"
import { ApiError } from "../middleware/errors"

type JwtHeader = {
  alg?: string
  kid?: string
  typ?: string
}

type FirebaseClaims = {
  iss?: string
  aud?: string
  sub?: string
  exp?: number
  iat?: number
  email?: string
  email_verified?: boolean
  firebase?: {
    sign_in_provider?: string
    identities?: Record<string, string[]>
  }
}

export type VerifiedFirebaseToken = {
  uid: string
  email: string
  emailVerified: boolean
  signInProvider?: string
}

type FirebaseJwk = {
  kid?: string
  kty?: string
  alg?: string
  use?: string
  n?: string
  e?: string
}

const GOOGLE_CERTS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
const MAX_CERT_CACHE_MS = 60 * 60 * 1000

let cachedCerts: { expiresAt: number; certs: Record<string, FirebaseJwk> } | undefined

export async function verifyFirebaseIdToken(idToken: string, env: BackendEnv): Promise<VerifiedFirebaseToken> {
  if (!env.FIREBASE_PROJECT_ID) {
    throw new ApiError(503, "Firebase authentication is not configured.", "firebase_not_configured")
  }
  if (env.NODE_ENV !== "production" && idToken.startsWith("test.")) {
    return parseTestFirebaseToken(idToken)
  }

  const parts = idToken.split(".")
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    throw new ApiError(401, "Firebase token is invalid.", "invalid_firebase_token")
  }

  const header = parseJwtPart<JwtHeader>(parts[0])
  if (header.alg !== "RS256" || !header.kid) {
    throw new ApiError(401, "Firebase token header is invalid.", "invalid_firebase_token")
  }

  const claims = parseJwtPart<FirebaseClaims>(parts[1])
  const nowSeconds = Math.floor(Date.now() / 1000)
  const issuer = `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`
  if (
    claims.iss !== issuer ||
    claims.aud !== env.FIREBASE_PROJECT_ID ||
    !claims.sub ||
    claims.sub.length > 128 ||
    !claims.exp ||
    claims.exp <= nowSeconds ||
    !claims.iat ||
    claims.iat > nowSeconds + 60 ||
    !claims.email
  ) {
    throw new ApiError(401, "Firebase token claims are invalid.", "invalid_firebase_token")
  }

  const certs = await getFirebaseCerts()
  const cert = certs[header.kid]
  if (!cert) throw new ApiError(401, "Firebase token key is unknown.", "invalid_firebase_token")

  const valid = await verifyRs256(`${parts[0]}.${parts[1]}`, parts[2], cert)
  if (!valid) throw new ApiError(401, "Firebase token signature is invalid.", "invalid_firebase_token")

  const verified: VerifiedFirebaseToken = {
    uid: claims.sub,
    email: claims.email,
    emailVerified: claims.email_verified === true,
  }
  if (claims.firebase?.sign_in_provider) verified.signInProvider = claims.firebase.sign_in_provider
  return verified
}

function parseTestFirebaseToken(idToken: string): VerifiedFirebaseToken {
  try {
    const claims = JSON.parse(Buffer.from(idToken.slice("test.".length), "base64url").toString("utf8")) as Partial<VerifiedFirebaseToken>
    if (!claims.uid || !claims.email) throw new Error("missing claims")
    const verified: VerifiedFirebaseToken = {
      uid: claims.uid,
      email: claims.email,
      emailVerified: claims.emailVerified === true,
    }
    if (claims.signInProvider) verified.signInProvider = claims.signInProvider
    return verified
  } catch {
    throw new ApiError(401, "Firebase test token is malformed.", "invalid_firebase_token")
  }
}

async function getFirebaseCerts() {
  const timestamp = Date.now()
  if (cachedCerts && cachedCerts.expiresAt > timestamp) return cachedCerts.certs
  const response = await fetch(GOOGLE_CERTS_URL, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10_000) })
  if (!response.ok) throw new ApiError(503, "Firebase token keys are unavailable.", "firebase_keys_unavailable")
  const data = await response.json() as { keys?: FirebaseJwk[] }
  const certs: Record<string, FirebaseJwk> = {}
  for (const key of data.keys ?? []) {
    if (key.kid) certs[key.kid] = key
  }
  cachedCerts = {
    certs,
    expiresAt: timestamp + certTtlMs(response.headers.get("cache-control")),
  }
  return certs
}

function certTtlMs(cacheControl: string | null) {
  const maxAge = cacheControl?.match(/max-age=(\d+)/)?.[1]
  if (!maxAge) return MAX_CERT_CACHE_MS
  return Math.min(Number(maxAge) * 1000, MAX_CERT_CACHE_MS)
}

async function verifyRs256(data: string, signature: string, jwk: FirebaseJwk) {
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  )
  return await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    Buffer.from(signature, "base64url"),
    new TextEncoder().encode(data),
  )
}

function parseJwtPart<T>(part: string): T {
  try {
    return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as T
  } catch {
    throw new ApiError(401, "Firebase token is malformed.", "invalid_firebase_token")
  }
}

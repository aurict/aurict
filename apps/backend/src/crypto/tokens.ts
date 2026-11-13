import type { BackendEnv } from "../env"
import { addSeconds, newId, now } from "./ids"

export type AccessTokenClaims = {
  sub: string
  typ: "access"
  iss: string
  aud: string
  iat: number
  exp: number
}

export type RefreshTokenPair = {
  id: string
  plaintext: string
  hash: string
  expiresAt: Date
}

export type JsonWebKey = {
  kty: "OKP"
  crv: "Ed25519"
  x: string
  alg: "EdDSA"
  use: "sig"
  kid: string
}

const encoder = new TextEncoder()

// Ed25519 SPKI DER is a fixed 12-byte prefix followed by the 32-byte raw public key.
const ED25519_SPKI_PREFIX_LENGTH = 12

const keyCache = new Map<string, Promise<CryptoKey>>()

export async function signAccessToken(userId: string, env: BackendEnv): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000)
  const claims: AccessTokenClaims = {
    sub: userId,
    typ: "access",
    iss: env.JWT_ISSUER,
    aud: env.JWT_AUDIENCE,
    iat: issuedAt,
    exp: issuedAt + env.ACCESS_TOKEN_TTL_SECONDS,
  }
  if (env.JWT_PRIVATE_KEY) {
    const header = base64UrlJson({ alg: "EdDSA", typ: "JWT", kid: await publicKeyId(env.JWT_PUBLIC_KEY!) })
    const payload = base64UrlJson(claims)
    const key = await importPrivateKey(env.JWT_PRIVATE_KEY)
    const signature = await crypto.subtle.sign("Ed25519", key, encoder.encode(`${header}.${payload}`))
    return `${header}.${payload}.${Buffer.from(signature).toString("base64url")}`
  }
  const header = base64UrlJson({ alg: "HS256", typ: "JWT" })
  const payload = base64UrlJson(claims)
  const signature = await hmac(`${header}.${payload}`, env.JWT_SECRET)
  return `${header}.${payload}.${signature}`
}

export async function verifyAccessToken(token: string, env: BackendEnv): Promise<AccessTokenClaims | null> {
  const parts = token.split(".")
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null
  let alg: string
  let claims: AccessTokenClaims
  try {
    alg = (JSON.parse(Buffer.from(parts[0], "base64url").toString()) as { alg?: string }).alg ?? ""
    claims = JSON.parse(Buffer.from(parts[1], "base64url").toString()) as AccessTokenClaims
  } catch {
    return null
  }
  if (alg === "EdDSA") {
    if (!env.JWT_PUBLIC_KEY) return null
    const key = await importPublicKey(env.JWT_PUBLIC_KEY)
    const valid = await crypto.subtle.verify(
      "Ed25519",
      key,
      Buffer.from(parts[2], "base64url"),
      encoder.encode(`${parts[0]}.${parts[1]}`),
    )
    if (!valid) return null
  } else if (alg === "HS256" && !env.JWT_PUBLIC_KEY) {
    // HS256 is only for deployments without an Ed25519 keypair; once one is configured,
    // JWT_SECRET must stop being a valid signing key.
    const expected = await hmac(`${parts[0]}.${parts[1]}`, env.JWT_SECRET)
    if (!timingSafeEqual(expected, parts[2])) return null
  } else {
    return null
  }
  if (claims.typ !== "access" || claims.iss !== env.JWT_ISSUER || claims.aud !== env.JWT_AUDIENCE) return null
  if (typeof claims.sub !== "string" || typeof claims.iat !== "number" || typeof claims.exp !== "number") return null
  if (claims.exp < Math.floor(Date.now() / 1000)) return null
  return claims
}

export async function publicKeyJwk(env: BackendEnv): Promise<JsonWebKey | null> {
  if (!env.JWT_PUBLIC_KEY) return null
  const spki = Buffer.from(env.JWT_PUBLIC_KEY, "base64")
  return {
    kty: "OKP",
    crv: "Ed25519",
    x: spki.subarray(ED25519_SPKI_PREFIX_LENGTH).toString("base64url"),
    alg: "EdDSA",
    use: "sig",
    kid: await publicKeyId(env.JWT_PUBLIC_KEY),
  }
}

export async function createRefreshToken(ttlSeconds: number): Promise<RefreshTokenPair> {
  const id = newId("rt")
  const plaintext = `${id}.${crypto.randomUUID()}.${crypto.randomUUID()}`
  return {
    id,
    plaintext,
    hash: await sha256(plaintext),
    expiresAt: addSeconds(now(), ttlSeconds),
  }
}

export function refreshTokenHash(token: string): Promise<string> {
  return sha256(token)
}

function importPrivateKey(base64Der: string): Promise<CryptoKey> {
  return importCachedKey(`pkcs8:${base64Der}`, () =>
    crypto.subtle.importKey("pkcs8", Buffer.from(base64Der, "base64"), { name: "Ed25519" }, false, ["sign"]),
  )
}

function importPublicKey(base64Der: string): Promise<CryptoKey> {
  return importCachedKey(`spki:${base64Der}`, () =>
    crypto.subtle.importKey("spki", Buffer.from(base64Der, "base64"), { name: "Ed25519" }, false, ["verify"]),
  )
}

function importCachedKey(cacheKey: string, importer: () => Promise<CryptoKey>): Promise<CryptoKey> {
  let pending = keyCache.get(cacheKey)
  if (!pending) {
    pending = importer().catch((error) => {
      keyCache.delete(cacheKey)
      throw error
    })
    keyCache.set(cacheKey, pending)
  }
  return pending
}

async function publicKeyId(base64Der: string): Promise<string> {
  const digest = await sha256(base64Der)
  return digest.slice(0, 16)
}

async function hmac(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(value))
  return Buffer.from(sig).toString("base64url")
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value))
  return Buffer.from(digest).toString("base64url")
}

function base64UrlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url")
}

function timingSafeEqual(a: string, b: string): boolean {
  const aa = Buffer.from(a)
  const bb = Buffer.from(b)
  if (aa.length !== bb.length) return false
  return safeCompare(aa, bb)
}

function safeCompare(a: Buffer, b: Buffer): boolean {
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!
  return diff === 0
}

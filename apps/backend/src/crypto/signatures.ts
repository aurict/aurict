const encoder = new TextEncoder()

export type SignatureAlgorithm = "ed25519" | "ecdsa-p256-sha256"

type PublicJwk = { kty: "OKP"; crv: "Ed25519"; x: string } | { kty: "EC"; crv: "P-256"; x: string; y: string }

/**
 * A device signing key is the JSON string of a public JWK (optionally prefixed with `jwk:`),
 * exactly as the client sent it at registration. Only Ed25519 and P-256 public keys are
 * accepted; anything carrying private material (`d`) or another key type is rejected.
 */
export function parseDevicePublicKey(value: string): { jwk: PublicJwk; algorithm: SignatureAlgorithm } | undefined {
  const raw = value.startsWith("jwk:") ? value.slice(4) : value
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return undefined
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined
  const key = parsed as Record<string, unknown>
  if ("d" in key) return undefined
  if (key.kty === "OKP" && key.crv === "Ed25519" && isBase64Url(key.x, 43)) {
    return { jwk: { kty: "OKP", crv: "Ed25519", x: key.x }, algorithm: "ed25519" }
  }
  if (key.kty === "EC" && key.crv === "P-256" && isBase64Url(key.x, 43) && isBase64Url(key.y, 43)) {
    return { jwk: { kty: "EC", crv: "P-256", x: key.x, y: key.y }, algorithm: "ecdsa-p256-sha256" }
  }
  return undefined
}

/** `fp_` + base64url(sha256(utf8(signingPublicKey))): the same derivation the CLI and mobile clients use. */
export async function deviceKeyFingerprint(signingPublicKey: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(signingPublicKey))
  return `fp_${Buffer.from(digest).toString("base64url")}`
}

/** Verifies `signature` (base64url, raw Ed25519 or IEEE-P1363 ECDSA) over the UTF-8 bytes of `payload`. */
export async function verifyDeviceSignature(signingPublicKey: string, payload: string, signature: string): Promise<boolean> {
  const key = parseDevicePublicKey(signingPublicKey)
  if (!key) return false
  try {
    const sig = copyBytes(Buffer.from(signature, "base64url"))
    const data = copyBytes(encoder.encode(payload))
    if (key.algorithm === "ed25519") {
      const imported = await crypto.subtle.importKey("jwk", key.jwk, { name: "Ed25519" }, false, ["verify"])
      return await crypto.subtle.verify({ name: "Ed25519" }, imported, sig, data)
    }
    const imported = await crypto.subtle.importKey("jwk", key.jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"])
    return await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, imported, sig, data)
  } catch {
    return false
  }
}

/**
 * Canonical payloads that devices sign. Fields are joined with "\n" and every field is
 * validated by the caller to contain no newline, so two different inputs never produce the
 * same bytes. The leading tag binds a signature to one purpose and protocol version.
 */
export function trustGrantPayload(grant: {
  userId: string
  sourceDeviceId: string
  sourceFingerprint: string
  targetDeviceId: string
  targetFingerprint: string
  scope: string
  issuedAt: string
}): string {
  return canonical("aurict.trust-grant.v1", [
    grant.userId,
    grant.sourceDeviceId,
    grant.sourceFingerprint,
    grant.targetDeviceId,
    grant.targetFingerprint,
    grant.scope,
    grant.issuedAt,
  ])
}

export function secretTransferPayload(transfer: {
  senderDeviceId: string
  recipientDeviceId: string
  provider: string
  algorithm: string
  nonce: string
  ciphertext: string
  senderKeyFingerprint: string
  recipientKeyFingerprint: string
}): string {
  return canonical("aurict.secret-transfer.v1", [
    transfer.senderDeviceId,
    transfer.recipientDeviceId,
    transfer.provider,
    transfer.algorithm,
    transfer.nonce,
    transfer.ciphertext,
    transfer.senderKeyFingerprint,
    transfer.recipientKeyFingerprint,
  ])
}

export function secretClaimPayload(claim: { transferId: string; recipientDeviceId: string; issuedAt: string }): string {
  return canonical("aurict.secret-claim.v1", [claim.transferId, claim.recipientDeviceId, claim.issuedAt])
}

function canonical(tag: string, fields: string[]): string {
  for (const field of fields) {
    if (field.includes("\n")) throw new Error("Signed fields must not contain newlines.")
  }
  return [tag, ...fields].join("\n")
}

function isBase64Url(value: unknown, length: number): value is string {
  return typeof value === "string" && value.length === length && /^[A-Za-z0-9_-]+$/.test(value)
}

function copyBytes(value: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(value.byteLength)
  copy.set(value)
  return copy
}

// The fingerprint and the signed payload formats are shared with the clients byte for byte.
export { deviceKeyFingerprint, secretClaimPayload, secretTransferPayload, trustGrantPayload } from "../../../../packages/backend-contract/src/signing"

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

function isBase64Url(value: unknown, length: number): value is string {
  return typeof value === "string" && value.length === length && /^[A-Za-z0-9_-]+$/.test(value)
}

function copyBytes(value: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(value.byteLength)
  copy.set(value)
  return copy
}

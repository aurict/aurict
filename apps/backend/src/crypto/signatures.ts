const encoder = new TextEncoder()
type PublicJwk = Record<string, unknown>

export async function verifyDeviceSignature(
  signingPublicKey: string,
  challenge: string,
  signature: string,
  algorithm: "ed25519" | "ecdsa-p256-sha256",
  requireCryptographicVerification: boolean,
): Promise<boolean> {
  try {
    const jwk = parseJwk(signingPublicKey)
    if (!jwk) return !requireCryptographicVerification && signature.length >= 32
    const sig = decodeBase64Url(signature)
    const challengeBytes = copyBytes(encoder.encode(challenge))
    if (algorithm === "ed25519") {
      const key = await crypto.subtle.importKey("jwk", jwk, { name: "Ed25519" }, false, ["verify"])
      return await crypto.subtle.verify({ name: "Ed25519" }, key, sig, challengeBytes)
    }
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"])
    return await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, sig, challengeBytes)
  } catch {
    return false
  }
}

function parseJwk(value: string): PublicJwk | undefined {
  const raw = value.startsWith("jwk:") ? value.slice(4) : value
  if (!raw.trim().startsWith("{")) return undefined
  return JSON.parse(raw) as PublicJwk
}

function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> {
  return copyBytes(Buffer.from(value, "base64url"))
}

function copyBytes(value: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(value.byteLength)
  copy.set(value)
  return copy
}

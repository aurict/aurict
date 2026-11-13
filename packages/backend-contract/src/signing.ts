/**
 * Formats that the backend and its clients must produce byte for byte. A mismatch here is a
 * security bug (a signature that verifies where it should not, or a pairing code that differs
 * between two screens), so both sides import this file instead of keeping their own copy.
 *
 * The Flutter app cannot import TypeScript; its copies are mobile/lib/remote/mobile_device_identity.dart
 * (fingerprint, safety code). test/signing.test.ts pins the vectors both implementations are
 * tested against.
 */

const encoder = new TextEncoder()

/** `fp_` + base64url(sha256(utf8(signingPublicKey))), where the key is the exact JWK string sent at registration. */
export async function deviceKeyFingerprint(signingPublicKey: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(signingPublicKey))
  return `fp_${Buffer.from(digest).toString("base64url")}`
}

/** A short code a person compares between two devices before pairing them, e.g. "K3QF-9XAP-2MZD". */
export function safetyCode(fingerprint: string): string {
  const body = fingerprint.replace(/^fp_/, "").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 12)
  return body.match(/.{1,4}/g)?.join("-") ?? body
}

/** Grant signed by the target device: "I trust `source` for `scope`". */
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

/** Signed by the sender over the whole encrypted envelope. */
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

/** Signed by the recipient to claim a transfer. */
export function secretClaimPayload(claim: { transferId: string; recipientDeviceId: string; issuedAt: string }): string {
  return canonical("aurict.secret-claim.v1", [claim.transferId, claim.recipientDeviceId, claim.issuedAt])
}

/**
 * A purpose tag followed by newline-joined fields. Fields may not contain a newline, so two
 * different inputs can never produce the same bytes, and the tag stops a signature made for
 * one purpose from being accepted for another.
 */
function canonical(tag: string, fields: string[]): string {
  for (const field of fields) {
    if (field.includes("\n")) throw new Error("Signed fields must not contain newlines.")
  }
  return [tag, ...fields].join("\n")
}

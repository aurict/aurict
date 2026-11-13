/**
 * Remote — paired phones (local trust anchors).
 *
 * The desktop decides which phones may control it. Pairing happens here, on the
 * desktop, after the user picks a phone: the phone's public key is pinned in a
 * local file and the desktop signs a trust grant for the backend. Afterwards the
 * desktop only accepts an answer, and only acts on events, that are signed by a
 * pinned key. A stolen access token or a compromised backend therefore cannot
 * add a controller: it would need this machine's device key and this local file.
 *
 * The trust-grant payload must match the backend's `trustGrantPayload`
 * (apps/backend/src/crypto/signatures.ts) byte for byte.
 */

import { backendRequest, RemoteApiError } from "./backend-client.js"
import { ensureAccessToken } from "./auth.js"
import { ensureDeviceIdentity, signWithStoredIdentity } from "./identity.js"
import { readSecureJson, writeSecureJson } from "./secure-store.js"
import { readStoredTokens } from "./session-store.js"

const PEERS_FILE = "paired-phones.json"

export interface PairedPhone {
  deviceId:         string
  name:             string
  signingPublicKey: string
  fingerprint:      string
  /** The account the phone was paired under; pins never carry over to another account. */
  userId:           string
  pairedAt:         string
}

export interface AccountDevice {
  id:                    string
  name:                  string
  platform:              string
  signingPublicKey:      string
  signingKeyFingerprint: string
  verificationStatus:    string
  revokedAt?:            string
  createdAt:             string
}

export async function fingerprintOfKey(signingPublicKey: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(signingPublicKey))
  return `fp_${Buffer.from(digest).toString("base64url")}`
}

/** A short, human-comparable code for a fingerprint, e.g. "K3QF-9XAP-2MZD". */
export function safetyCode(fingerprint: string): string {
  const body = fingerprint.replace(/^fp_/, "").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 12)
  return body.match(/.{1,4}/g)?.join("-") ?? body
}

export function listPairedPhones(): PairedPhone[] {
  const userId = readStoredTokens()?.userId
  const all = readSecureJson<PairedPhone[]>(PEERS_FILE) ?? []
  return all.filter((peer) => peer.userId === userId)
}

export function findPairedPhone(deviceId: string): PairedPhone | undefined {
  return listPairedPhones().find((peer) => peer.deviceId === deviceId)
}

function writePairedPhones(peers: PairedPhone[]): void {
  writeSecureJson(PEERS_FILE, peers)
}

/** Verified, unrevoked phones on this account, with their key checked against their fingerprint. */
export async function listAccountPhones(): Promise<AccountDevice[]> {
  const accessToken = await ensureAccessToken()
  const { devices } = await backendRequest<{ devices: AccountDevice[] }>("/devices", { accessToken })
  const phones: AccountDevice[] = []
  for (const device of devices) {
    if (device.platform !== "mobile" || device.verificationStatus !== "verified" || device.revokedAt) continue
    if (await fingerprintOfKey(device.signingPublicKey) !== device.signingKeyFingerprint) continue
    phones.push(device)
  }
  return phones
}

export function trustGrantPayload(grant: {
  userId:            string
  sourceDeviceId:    string
  sourceFingerprint: string
  targetDeviceId:    string
  targetFingerprint: string
  scope:             string
  issuedAt:          string
}): string {
  const fields = [grant.userId, grant.sourceDeviceId, grant.sourceFingerprint, grant.targetDeviceId, grant.targetFingerprint, grant.scope, grant.issuedAt]
  if (fields.some((field) => field.includes("\n"))) throw new Error("Signed fields must not contain newlines.")
  return ["aurict.trust-grant.v1", ...fields].join("\n")
}

/**
 * Pairs a phone: pins its key locally and registers a desktop-signed "remote" trust
 * grant with the backend. The caller must have shown the phone's name and safety code
 * to the user and received an explicit confirmation.
 */
export async function pairPhone(deviceId: string): Promise<PairedPhone> {
  const userId = readStoredTokens()?.userId
  if (!userId) throw new RemoteApiError("not_signed_in", "Sign in with /remote login before pairing a phone.", "client")
  const phone = (await listAccountPhones()).find((device) => device.id === deviceId)
  if (!phone) throw new RemoteApiError("phone_not_found", "No verified phone with that id on this account.", "client")

  const identity = await ensureDeviceIdentity()
  const issuedAt = new Date().toISOString()
  const signature = await signWithStoredIdentity(trustGrantPayload({
    userId,
    sourceDeviceId:    phone.id,
    sourceFingerprint: phone.signingKeyFingerprint,
    targetDeviceId:    identity.deviceId,
    targetFingerprint: identity.signingKeyFingerprint,
    scope:             "remote",
    issuedAt,
  }))
  const accessToken = await ensureAccessToken()
  await backendRequest(`/devices/${identity.deviceId}/trust`, {
    method: "POST",
    accessToken,
    body: { sourceDeviceId: phone.id, scope: "remote", grant: { issuedAt, signature } },
  })

  const paired: PairedPhone = {
    deviceId:         phone.id,
    name:             phone.name,
    signingPublicKey: phone.signingPublicKey,
    fingerprint:      phone.signingKeyFingerprint,
    userId,
    pairedAt:         issuedAt,
  }
  const others = (readSecureJson<PairedPhone[]>(PEERS_FILE) ?? []).filter((peer) => !(peer.deviceId === phone.id && peer.userId === userId))
  writePairedPhones([...others, paired])
  return paired
}

/** Removes the local pin and revokes the backend trust (best effort for the latter). */
export async function unpairPhone(deviceId: string): Promise<boolean> {
  const userId = readStoredTokens()?.userId
  const all = readSecureJson<PairedPhone[]>(PEERS_FILE) ?? []
  const remaining = all.filter((peer) => !(peer.deviceId === deviceId && peer.userId === userId))
  const removed = remaining.length !== all.length
  writePairedPhones(remaining)
  try {
    const identity = await ensureDeviceIdentity()
    const accessToken = await ensureAccessToken()
    await backendRequest(`/devices/${identity.deviceId}/untrust`, { method: "POST", accessToken, body: { sourceDeviceId: deviceId } })
  } catch {
    // The local pin is what this desktop enforces; the backend revocation is defence in depth.
  }
  return removed
}

/** Verifies a base64url Ed25519 signature by a pinned phone over the UTF-8 bytes of `payload`. */
export async function verifyPhoneSignature(phone: PairedPhone, payload: string, signature: string): Promise<boolean> {
  try {
    if (await fingerprintOfKey(phone.signingPublicKey) !== phone.fingerprint) return false
    const jwk = JSON.parse(phone.signingPublicKey) as { kty?: string; crv?: string; x?: string }
    if (jwk.kty !== "OKP" || jwk.crv !== "Ed25519" || typeof jwk.x !== "string") return false
    const key = await crypto.subtle.importKey("jwk", { kty: "OKP", crv: "Ed25519", x: jwk.x }, { name: "Ed25519" }, false, ["verify"])
    return await crypto.subtle.verify({ name: "Ed25519" }, key, Buffer.from(signature, "base64url"), new TextEncoder().encode(payload))
  } catch {
    return false
  }
}

/**
 * Remote — CLI device identity (Ed25519 signing key).
 *
 * Bit-compatible contract with mobile (mobile/lib/remote/mobile_device_identity.dart):
 *   - signingPublicKey: JWK STRING → {"kty":"OKP","crv":"Ed25519","x":<base64url>,"ext":true,"key_ops":["verify"]}
 *   - signingKeyFingerprint: "fp_" + base64url(sha256(utf8(jwkString)))
 *   - encryptionPublicKey: same as signingPublicKey for now (the backend expects this too)
 *   - signature: base64url(ed25519_sign(utf8(payload))) — a raw Ed25519 signature, not JWS
 *
 * The backend (`apps/backend/src/crypto/signatures.ts`) derives the same fingerprint, and parses and verifies
 * `signingPublicKey` directly via `crypto.subtle.importKey("jwk", ...)` — so
 * the JWK generated here is produced/stored/signed with the same WebCrypto
 * (Bun) the backend runs on. Verified via an Ed25519
 * generate→export→sign→import→verify round-trip probe.
 */

import { backendRequest, RemoteApiError } from "./backend-client.js"
import { ensureAccessToken } from "./auth.js"
import { readStoredTokens } from "./session-store.js"
import { readSecureJson, writeSecureJson, deleteSecureFile } from "./secure-store.js"
import { deviceKeyFingerprint } from "../../../backend-contract/src/signing"

const IDENTITY_FILE = "device.json"

// Since tsconfig's lib is "ES2022" (no DOM), the ambient `JsonWebKey` type
// isn't available — a local, minimal type for the fields we use of an Ed25519 JWK.
export interface Ed25519Jwk {
  kty:      string
  crv:      string
  x:        string
  d?:       string
  ext?:     boolean
  key_ops?: string[]
}

interface StoredIdentity {
  deviceId:              string
  privateJwk:            Ed25519Jwk
  publicJwk:             string   // wire format (JSON string) — same value sent at registration
  signingKeyFingerprint: string
  verified:              boolean
  /** The account this was registered under — if a different account logs in
   *  on the same machine (userId mismatch), this identity isn't reused and
   *  re-registration is attempted. */
  registeredForUserId?:  string
}

export interface DeviceIdentity {
  deviceId:              string
  signingPublicKey:      string
  encryptionPublicKey:   string
  signingKeyFingerprint: string
  verified:              boolean
}

interface KeyMaterial {
  privateJwk:  Ed25519Jwk
  publicJwk:   string
  fingerprint: string
}

function toWireJwk(x: string): string {
  return JSON.stringify({ kty: "OKP", crv: "Ed25519", x, ext: true, key_ops: ["verify"] })
}

// Same derivation the backend applies at registration (packages/backend-contract).
const fingerprintOf = deviceKeyFingerprint

async function generateKeyMaterial(): Promise<KeyMaterial> {
  const keyPair    = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]) as CryptoKeyPair
  const privateJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey) as Ed25519Jwk
  if (!privateJwk.x) throw new Error("Ed25519 key export did not include the public component.")
  const publicJwk  = toWireJwk(privateJwk.x)  // the private JWK's "x" field = the public key
  const fingerprint = await fingerprintOf(publicJwk)
  return { privateJwk, publicJwk, fingerprint }
}

/** Signs the given raw text (UTF8) with the stored private key; returns a base64url signature. */
export async function signPayload(privateJwk: Ed25519Jwk, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey("jwk", privateJwk, { name: "Ed25519" }, false, ["sign"])
  const sig = await crypto.subtle.sign({ name: "Ed25519" }, key, new TextEncoder().encode(payload))
  return Buffer.from(sig).toString("base64url")
}

function deviceName(): string {
  return process.env.AURICT_REMOTE_DEVICE_NAME?.trim() || `Aurict CLI (${process.platform})`
}

function devicePlatform(): "cli" | "desktop" {
  return process.env.AURICT_REMOTE_PLATFORM === "desktop" ? "desktop" : "cli"
}

function toPublicIdentity(stored: StoredIdentity): DeviceIdentity {
  return {
    deviceId:              stored.deviceId,
    signingPublicKey:      stored.publicJwk,
    encryptionPublicKey:   stored.publicJwk,
    signingKeyFingerprint: stored.signingKeyFingerprint,
    verified:              stored.verified,
  }
}

async function registerAndVerify(material: KeyMaterial, accessToken: string, userId: string | undefined): Promise<StoredIdentity> {
  const registered = await backendRequest<{
    device:       { id: string }
    verification: { challenge: string; expiresAt: string; algorithms: string[] }
  }>("/devices/register", {
    method: "POST",
    accessToken,
    body: {
      name:                  deviceName(),
      platform:              devicePlatform(),
      encryptionPublicKey:   material.publicJwk,
      signingPublicKey:      material.publicJwk,
      signingKeyFingerprint: material.fingerprint,
    },
  })

  const signature = await signPayload(material.privateJwk, registered.verification.challenge)
  const verified = await backendRequest<{ device: { id: string; verifiedAt?: string } }>(
    `/devices/${registered.device.id}/verify`,
    { method: "POST", accessToken, body: { challenge: registered.verification.challenge, signature, algorithm: "ed25519" } },
  )

  return {
    deviceId:              registered.device.id,
    privateJwk:            material.privateJwk,
    publicJwk:             material.publicJwk,
    signingKeyFingerprint: material.fingerprint,
    verified:              !!verified.device.verifiedAt,
    ...(userId !== undefined ? { registeredForUserId: userId } : {}),
  }
}

/**
 * Ensures a device identity: if a locally-verified identity that belongs to
 * the same account exists, returns it; otherwise (first run, account
 * switch, or a previous registration left half-done) generates/reuses a
 * key, registers it with the backend, and verifies it by signing a challenge.
 *
 * If a different account logs in on the same machine
 * (`registeredForUserId` mismatch), the old key is NOT reused — a fresh key
 * is generated directly (otherwise, since the fingerprint is already
 * registered to the old account, an unnecessary `device_exists` round-trip
 * would occur). On `device_exists` (e.g. the config directory was deleted
 * and the key lost, leaving a stale registration hanging on the backend),
 * it also retries once more with a fresh key.
 */
export async function ensureDeviceIdentity(): Promise<DeviceIdentity> {
  const currentUserId = readStoredTokens()?.userId
  const stored = readSecureJson<StoredIdentity>(IDENTITY_FILE)
  const sameAccount = stored !== null && stored.registeredForUserId === currentUserId
  if (stored?.verified && sameAccount) return toPublicIdentity(stored)

  const accessToken = await ensureAccessToken()
  const material = stored && sameAccount
    ? { privateJwk: stored.privateJwk, publicJwk: stored.publicJwk, fingerprint: stored.signingKeyFingerprint }
    : await generateKeyMaterial()

  try {
    const identity = await registerAndVerify(material, accessToken, currentUserId)
    writeSecureJson(IDENTITY_FILE, identity)
    return toPublicIdentity(identity)
  } catch (error) {
    if (error instanceof RemoteApiError && error.code === "device_exists") {
      const fresh = await generateKeyMaterial()
      const identity = await registerAndVerify(fresh, accessToken, currentUserId)
      writeSecureJson(IDENTITY_FILE, identity)
      return toPublicIdentity(identity)
    }
    throw error
  }
}

export function readDeviceIdentity(): DeviceIdentity | null {
  const stored = readSecureJson<StoredIdentity>(IDENTITY_FILE)
  return stored ? toPublicIdentity(stored) : null
}

/** Signs with the stored private key, for remote-session signatures (offer/answer/event). */
export async function signWithStoredIdentity(payload: string): Promise<string> {
  const stored = readSecureJson<StoredIdentity>(IDENTITY_FILE)
  if (!stored) throw new Error("No device identity found. Call ensureDeviceIdentity() first.")
  return signPayload(stored.privateJwk, payload)
}

export function clearDeviceIdentity(): void {
  deleteSecureFile(IDENTITY_FILE)
}

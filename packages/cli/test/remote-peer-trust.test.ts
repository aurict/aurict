import { describe, expect, it } from "bun:test"
import { safetyCode, trustGrantPayload, verifyPhoneSignature, fingerprintOfKey, type PairedPhone } from "../src/remote/peer-trust.js"

describe("peer-trust", () => {
  // Same vectors as mobile/test/remote/remote_safety_code_test.dart.
  it("derives the safety code exactly like the mobile app", () => {
    expect(safetyCode("fp_abc-_DEF123ghi456XYZ")).toBe("ABCD-EF12-3GHI")
    expect(safetyCode("fp_ab")).toBe("AB")
    expect(safetyCode("fp_abcdefgh")).toBe("ABCD-EFGH")
  })

  it("builds the trust grant payload the backend verifies", () => {
    expect(trustGrantPayload({
      userId: "usr_1", sourceDeviceId: "dev_m", sourceFingerprint: "fp_m", targetDeviceId: "dev_d",
      targetFingerprint: "fp_d", scope: "remote", issuedAt: "2026-11-13T12:00:00.000Z",
    })).toBe("aurict.trust-grant.v1\nusr_1\ndev_m\nfp_m\ndev_d\nfp_d\nremote\n2026-11-13T12:00:00.000Z")
    expect(() => trustGrantPayload({
      userId: "usr_1\nx", sourceDeviceId: "a", sourceFingerprint: "b", targetDeviceId: "c", targetFingerprint: "d", scope: "remote", issuedAt: "t",
    })).toThrow()
  })

  it("rejects a pinned phone whose stored key no longer matches its fingerprint", async () => {
    const pair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]) as unknown as CryptoKeyPair
    const x = (await crypto.subtle.exportKey("jwk", pair.publicKey)).x!
    const signingPublicKey = JSON.stringify({ kty: "OKP", crv: "Ed25519", x, ext: true, key_ops: ["verify"] })
    const signature = Buffer.from(await crypto.subtle.sign({ name: "Ed25519" }, pair.privateKey, new TextEncoder().encode("hello"))).toString("base64url")
    const phone: PairedPhone = { deviceId: "d", name: "p", signingPublicKey, fingerprint: await fingerprintOfKey(signingPublicKey), userId: "u", pairedAt: "t" }
    expect(await verifyPhoneSignature(phone, "hello", signature)).toBe(true)
    expect(await verifyPhoneSignature(phone, "hellO", signature)).toBe(false)
    expect(await verifyPhoneSignature({ ...phone, fingerprint: "fp_other" }, "hello", signature)).toBe(false)
  })
})

import { describe, expect, it } from "bun:test"
import { deviceKeyFingerprint, safetyCode, secretClaimPayload, secretTransferPayload, trustGrantPayload } from "../src/signing"

// Fixed vectors. The mobile app (mobile/test/remote/remote_safety_code_test.dart) is tested
// against the same safety-code vectors; changing any of these is a protocol change.
describe("backend contract: signing formats", () => {
  it("derives fingerprints from the exact key string (vector computed independently with Python hashlib)", async () => {
    const jwk = '{"kty":"OKP","crv":"Ed25519","x":"11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo","ext":true,"key_ops":["verify"]}'
    expect(await deviceKeyFingerprint(jwk)).toBe("fp_dH6pzq8SL7zCFxk5zNhv9wDMPjj0RFjuKpIrPzeQtjY")
    expect(await deviceKeyFingerprint(`${jwk} `)).not.toBe(await deviceKeyFingerprint(jwk))
  })

  it("derives the safety code like the mobile app", () => {
    expect(safetyCode("fp_abc-_DEF123ghi456XYZ")).toBe("ABCD-EF12-3GHI")
    expect(safetyCode("fp_ab")).toBe("AB")
    expect(safetyCode("fp_abcdefgh")).toBe("ABCD-EFGH")
  })

  it("builds tagged, newline-separated payloads and rejects newlines in fields", () => {
    expect(trustGrantPayload({
      userId: "usr_1", sourceDeviceId: "dev_m", sourceFingerprint: "fp_m", targetDeviceId: "dev_d",
      targetFingerprint: "fp_d", scope: "remote", issuedAt: "2026-11-13T12:00:00.000Z",
    })).toBe("aurict.trust-grant.v1\nusr_1\ndev_m\nfp_m\ndev_d\nfp_d\nremote\n2026-11-13T12:00:00.000Z")
    expect(secretClaimPayload({ transferId: "sec_1", recipientDeviceId: "dev_m", issuedAt: "t" })).toBe("aurict.secret-claim.v1\nsec_1\ndev_m\nt")
    expect(secretTransferPayload({
      senderDeviceId: "a", recipientDeviceId: "b", provider: "p", algorithm: "aes-256-gcm", nonce: "n", ciphertext: "c",
      senderKeyFingerprint: "fa", recipientKeyFingerprint: "fb",
    })).toBe("aurict.secret-transfer.v1\na\nb\np\naes-256-gcm\nn\nc\nfa\nfb")
    expect(() => secretClaimPayload({ transferId: "sec_1\nx", recipientDeviceId: "d", issuedAt: "t" })).toThrow()
  })
})

import { describe, it, expect } from "bun:test"
import { withAbort, fetchWithUrlPolicy } from "../src/security/network-policy.js"

describe("network-policy iptal edilebilirliği", () => {
  it("takılan bir işlemi signal abort edilince hemen sonlandırır", async () => {
    // dns.promises.lookup bir AbortSignal almaz; takılan bir resolver bu yarış
    // olmadan hem timeout'u hem parent iptalini yok sayardı.
    const controller = new AbortController()
    const stuck = withAbort(controller.signal, () => new Promise<never>(() => { /* asla settle olmaz */ }))
    setTimeout(() => controller.abort(), 10)

    await expect(stuck).rejects.toMatchObject({ name: "AbortError" })
  })

  it("zaten iptal edilmiş bir signal ile işi hiç başlatmaz", async () => {
    const controller = new AbortController()
    controller.abort()
    let started = false

    await expect(
      withAbort(controller.signal, async () => { started = true }),
    ).rejects.toMatchObject({ name: "AbortError" })
    expect(started).toBe(false)
  })

  it("signal yoksa işi olduğu gibi çalıştırır", async () => {
    await expect(withAbort(undefined, async () => "ok")).resolves.toBe("ok")
  })

  it("iş bittikten sonra signal üzerinde dinleyici bırakmaz", async () => {
    const controller = new AbortController()
    let addCount = 0
    let removeCount = 0
    const realAdd = controller.signal.addEventListener.bind(controller.signal)
    const realRemove = controller.signal.removeEventListener.bind(controller.signal)
    controller.signal.addEventListener = (...a: Parameters<typeof realAdd>) => { addCount++; return realAdd(...a) }
    controller.signal.removeEventListener = (...a: Parameters<typeof realRemove>) => { removeCount++; return realRemove(...a) }

    await withAbort(controller.signal, async () => "ok")
    expect(removeCount).toBe(addCount)
  })

  it("zaten iptal edilmiş bir signal ile fetchWithUrlPolicy DNS'e hiç girmez", async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(
      fetchWithUrlPolicy("https://example.com/", { signal: controller.signal }),
    ).rejects.toMatchObject({ name: "AbortError" })
  })
})

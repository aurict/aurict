import { describe, expect, it } from "bun:test"
import { PUBLIC_PRODUCT_CATALOG } from "../src/marketing/public-catalog.js"
import { BUILT_IN_PROVIDER_IDS, ProviderRegistry } from "../src/provider/registry.js"

describe("public product catalog", () => {
  it("keeps public provider facts aligned with the built-in runtime contract", () => {
    const catalogIds = PUBLIC_PRODUCT_CATALOG.providers.map((provider) => provider.id).sort()

    expect(catalogIds).toEqual([...BUILT_IN_PROVIDER_IDS].sort())
    expect(BUILT_IN_PROVIDER_IDS.every((id) => ProviderRegistry.has(id))).toBe(true)
  })
})

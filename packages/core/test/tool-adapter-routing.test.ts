import { describe, expect, it } from "bun:test"
import { readFileSync } from "node:fs"
import type { OmniConfig } from "../src/config/config.js"
import { buildAITools, listEligibleAIToolIds } from "../src/agent/tool-adapter.js"

const config: OmniConfig = {}

describe("AI tool catalog and executable adapters", () => {
  it("catalogs eligible IDs without exposing disabled security tools", () => {
    const ids = listEligibleAIToolIds({ config, sessionId: "catalog-test", supportsVision: true })
    expect(ids).toContain("read")
    expect(ids).toContain("read_image")
    expect(ids).not.toContain("security_scan")
  })

  it("removes multimodal tools for a non-vision attempt", () => {
    const ids = listEligibleAIToolIds({ config, sessionId: "no-vision-test", supportsVision: false })
    expect(ids).not.toContain("read_image")
  })

  it("builds executable wrappers only for routed tool IDs", () => {
    const tools = buildAITools({
      workdir: process.cwd(),
      sessionId: "selected-tools-test",
      provider: "test",
      model: "test-model",
      config,
      supportsVision: true,
      selectedToolIds: ["read", "grep"],
    })
    expect(Object.keys(tools)).toEqual(["read", "grep"])
  })

  it("keeps catalog and executable eligibility synchronized", () => {
    const catalog = listEligibleAIToolIds({ config, sessionId: "sync-test", supportsVision: false })
    const tools = buildAITools({
      workdir: process.cwd(),
      sessionId: "sync-test",
      provider: "test",
      model: "test-model",
      config,
      supportsVision: false,
      selectedToolIds: catalog,
    })
    expect(Object.keys(tools)).toEqual(catalog)
  })

  it("keeps the agent loop on one lightweight catalog and one build per attempt", () => {
    const source = readFileSync(new URL("../src/agent/loop.ts", import.meta.url), "utf8")
    expect(source.match(/listEligibleAIToolIds\(\{/g)?.length).toBe(1)
    expect(source.match(/buildRoutedAITools\(\{/g)?.length).toBe(1)
  })
})

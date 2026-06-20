import { describe, it, expect } from "bun:test"
import { agentPool } from "../src/agent/pool.js"
import { AGENT_TYPE_TOOLS } from "../src/agent/protocol.js"

describe("agentPool", () => {
  it("exposes active getter as array", () => {
    const agents = agentPool.active
    expect(Array.isArray(agents)).toBe(true)
  })

  it("active returns AgentInfo objects with correct shape", () => {
    for (const a of agentPool.active) {
      expect(typeof a.id).toBe("string")
      expect(typeof a.name).toBe("string")
      expect(typeof a.type).toBe("string")
      expect(["running", "done", "error"]).toContain(a.status)
    }
  })

  it("listSessions returns array", () => {
    const sessions = agentPool.listSessions()
    expect(Array.isArray(sessions)).toBe(true)
  })
})

describe("AGENT_TYPE_TOOLS", () => {
  it("every agent type has a non-empty tools array", () => {
    const types = Object.keys(AGENT_TYPE_TOOLS) as Array<keyof typeof AGENT_TYPE_TOOLS>
    expect(types.length).toBeGreaterThan(5)
    for (const t of types) {
      expect(Array.isArray(AGENT_TYPE_TOOLS[t])).toBe(true)
      expect(AGENT_TYPE_TOOLS[t].length).toBeGreaterThan(0)
    }
  })

  it("coordinator has dispatch tools (subagent, send_message, scratchpad, critique)", () => {
    // Coordinator: orchestrator agent — subagent spawn + send_message + scratchpad + critique
    expect(AGENT_TYPE_TOOLS.coordinator).toContain("subagent")
    expect(AGENT_TYPE_TOOLS.coordinator).toContain("send_message")
    expect(AGENT_TYPE_TOOLS.coordinator).toContain("scratchpad")
    expect(AGENT_TYPE_TOOLS.coordinator).toContain("critique")
  })

  it("coordinator has NO read/write/bash", () => {
    expect(AGENT_TYPE_TOOLS.coordinator).not.toContain("read")
    expect(AGENT_TYPE_TOOLS.coordinator).not.toContain("write")
    expect(AGENT_TYPE_TOOLS.coordinator).not.toContain("bash")
  })

  it("code agent has write and bash and lsp", () => {
    expect(AGENT_TYPE_TOOLS.code).toContain("write")
    expect(AGENT_TYPE_TOOLS.code).toContain("bash")
    expect(AGENT_TYPE_TOOLS.code).toContain("lsp")
  })

  it("explore agent has read, glob, grep, webfetch, websearch", () => {
    expect(AGENT_TYPE_TOOLS.explore).toContain("read")
    expect(AGENT_TYPE_TOOLS.explore).toContain("glob")
    expect(AGENT_TYPE_TOOLS.explore).toContain("grep")
    expect(AGENT_TYPE_TOOLS.explore).toContain("webfetch")
    expect(AGENT_TYPE_TOOLS.explore).toContain("websearch")
  })

  it("explore agent has NO bash", () => {
    expect(AGENT_TYPE_TOOLS.explore).not.toContain("bash")
  })

  it("security agent has lsp and websearch", () => {
    expect(AGENT_TYPE_TOOLS.security).toContain("lsp")
    expect(AGENT_TYPE_TOOLS.security).toContain("websearch")
  })

  it("security agent has NO bash", () => {
    expect(AGENT_TYPE_TOOLS.security).not.toContain("bash")
  })

  it("refactor has NO bash (safe code transform)", () => {
    expect(AGENT_TYPE_TOOLS.refactor).not.toContain("bash")
  })

  it("every agent type (except coordinator) includes read", () => {
    const types = Object.keys(AGENT_TYPE_TOOLS) as Array<keyof typeof AGENT_TYPE_TOOLS>
    for (const t of types) {
      if (t === "coordinator") continue
      expect(AGENT_TYPE_TOOLS[t]).toContain("read")
    }
  })

  it("all agent types (except critic) include send_message", () => {
    const types = Object.keys(AGENT_TYPE_TOOLS) as Array<keyof typeof AGENT_TYPE_TOOLS>
    for (const t of types) {
      // Critic agent read-only, sadece rapor verir — mesaj göndermez
      if (t === "critic") continue
      expect(AGENT_TYPE_TOOLS[t]).toContain("send_message")
    }
  })
})

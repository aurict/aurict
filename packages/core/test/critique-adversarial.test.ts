/**
 * Faz 4.2c — critique tool: adversarial persona, working-set resolve, ve BYOK
 * (hardcoded model yerine provider'ın kendi defaultModel()'i) davranışlarını
 * doğrular.
 */
import { describe, it, expect, mock } from "bun:test"
import { randomUUID } from "node:crypto"
import { ProviderRegistry } from "../src/provider/registry.js"
import { createMockProvider, createMockContext, createTempDir } from "./helpers.js"
import { markCritiqueRequired, getWorkingSetSnapshot, clearWorkingSet } from "../src/agent/working-set.js"

const spawnCalls: Array<{ desc: string; prompt: string; model: string; provider: string }> = []

mock.module("../src/agent/pool.js", () => ({
  agentPool: {
    spawn: async (opts: { desc: string; prompt: string; model: string; provider: string }) => {
      spawnCalls.push({ desc: opts.desc, prompt: opts.prompt, model: opts.model, provider: opts.provider })
      return `mock critic output for ${opts.desc}`
    },
  },
  PoolFullError: class PoolFullError extends Error {},
}))

const { critiqueTool } = await import("../src/tool/built-in/critique.js")

function nextCritiqueId(label: string): string {
  return `${label}-${randomUUID()}`
}

function createCritiqueContext(options: Parameters<typeof createMockContext>[0] = {}) {
  return createMockContext({
    ...options,
    sessionId: options.sessionId ?? nextCritiqueId("critique-session"),
  })
}

describe("critiqueTool", () => {
  it("adversarial kapalıyken (varsayılan) tek bir critic spawn eder", async () => {
    spawnCalls.length = 0
    const { dir, cleanup } = createTempDir()
    try {
      const ctx = createCritiqueContext({ workdir: dir, provider: "anthropic" })
      const result = await critiqueTool.execute(
        { target: "code", content: "function foo() {}", context: nextCritiqueId("no-adversarial") },
        ctx,
      )
      expect(result.error).toBeUndefined()
      expect(spawnCalls.length).toBe(1)
      expect(result.output).toContain("[critique:code]")
      expect(result.output).not.toContain("adversarial")
    } finally {
      cleanup()
    }
  })

  it("critique.adversarial:true iken İKİ bağımsız critic spawn eder (normal + hostile persona)", async () => {
    spawnCalls.length = 0
    const { dir, cleanup, createFile } = createTempDir()
    createFile(".aurict/config.json", JSON.stringify({ critique: { adversarial: true } }))
    try {
      const ctx = createCritiqueContext({ workdir: dir, provider: "anthropic" })
      const result = await critiqueTool.execute(
        { target: "code", content: "function foo() {}", context: nextCritiqueId("adversarial") },
        ctx,
      )
      expect(result.error).toBeUndefined()
      expect(spawnCalls.length).toBe(2)
      expect(spawnCalls[1]!.prompt).toContain("hostile senior reviewer")
      expect(result.output).toContain("[critique:code:adversarial]")
    } finally {
      cleanup()
    }
  })

  it("ctx.model verilmemişse provider'ın kendi defaultModel()'ini kullanır (BYOK)", async () => {
    spawnCalls.length = 0
    ProviderRegistry.register(createMockProvider({ id: "test-critique-provider", defaultModel: "critique-default-model" }))
    const { dir, cleanup } = createTempDir()
    try {
      const ctx = createCritiqueContext({ workdir: dir, provider: "test-critique-provider" })
      ;(ctx as { model?: string }).model = undefined
      await critiqueTool.execute(
        { target: "code", content: "x", context: nextCritiqueId("byok") },
        ctx,
      )
      expect(spawnCalls[0]!.model).toBe("critique-default-model")
    } finally {
      cleanup()
    }
  })

  it("configured independent reviewer uses its own provider and model visibly", async () => {
    spawnCalls.length = 0
    ProviderRegistry.register(createMockProvider({ id: "reviewer-provider", defaultModel: "reviewer-default" }))
    const { dir, cleanup, createFile } = createTempDir()
    createFile(".aurict/config.json", JSON.stringify({ critique: { provider: "reviewer-provider", model: "reviewer-model" } }))
    try {
      const result = await critiqueTool.execute(
        { target: "code", content: "x", context: nextCritiqueId("independent") },
        createCritiqueContext({ workdir: dir, provider: "anthropic", model: "primary-model" }),
      )
      expect(spawnCalls[0]?.provider).toBe("reviewer-provider")
      expect(spawnCalls[0]?.model).toBe("reviewer-model")
      expect(result.output).toContain("independent")
    } finally { cleanup() }
  })

  it("çalıştırıldığında working-set'teki bekleyen critique kaydını çözer", async () => {
    const sid = nextCritiqueId("critique-tool-resolve")
    markCritiqueRequired(sid, ["src/a.ts"], 80)
    expect(getWorkingSetSnapshot(sid).items.find(i => i.kind === "critique")?.status).toBe("active")

    const { dir, cleanup } = createTempDir()
    try {
      const ctx = createMockContext({ workdir: dir, provider: "anthropic", sessionId: sid })
      await critiqueTool.execute({ target: "code", content: "x", context: nextCritiqueId("resolve") }, ctx)
      expect(getWorkingSetSnapshot(sid).items.find(i => i.kind === "critique")?.status).toBe("resolved")
    } finally {
      clearWorkingSet(sid)
      cleanup()
    }
  })

  it("content boşsa hata döner ve resolve tetiklenmez", async () => {
    const result = await critiqueTool.execute({ target: "code", content: "", context: "x" }, createMockContext())
    expect(result.error).toBeTruthy()
  })
})

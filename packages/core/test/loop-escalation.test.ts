/**
 * Faz 2.2 — runAgent'ın adaptif reasoning effort'u gerçekten uyguladığını
 * uçtan uca doğrular: escalation.enabled + karmaşık/actionable bir prompt ->
 * buildThinkingOptions karmaşıklık skorundan türetilmiş bir bütçeyle çağrılır;
 * escalation kapalıyken (varsayılan) hiç çağrılmaz (opts.effort verilmemişse).
 */
import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test"
import { ProviderRegistry } from "../src/provider/registry.js"
import { createMockProvider, createTempDir } from "./helpers.js"
import { clearPromptSectionCache } from "../src/agent/prompt-sections.js"

// runAgent() gerçek prompt-section cache'ini kullanıyor (paylaşılan modül state) —
// başka test dosyalarına sızmaması için her testten sonra temizle.
afterEach(() => clearPromptSectionCache())

interface StreamSpec {
  parts: Array<Record<string, unknown>>
}

let streamSpecs: StreamSpec[] = []
let streamCallCount = 0

mock.module("ai", () => ({
  tool: (def: unknown) => def,
  streamText: () => {
    const spec = streamSpecs[streamCallCount] ?? streamSpecs[streamSpecs.length - 1]!
    streamCallCount++
    return {
      fullStream: (async function* () {
        for (const part of spec.parts) yield part
      })(),
      usage: Promise.resolve({}),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      experimental_providerMetadata: Promise.resolve(undefined) as any,
      finishReason: Promise.resolve("stop"),
      response: Promise.resolve({ messages: [] }),
    }
  },
  generateText: async () => {
    throw new Error("generateText should not be called in this streaming test")
  },
}))

const { runAgent } = await import("../src/agent/loop.js")

function registerMockPlugin(id: string, opts: {
  supportsThinking: boolean
  onBuildThinkingOptions?: (modelId: string, budget: number) => void
}) {
  const plugin = createMockProvider({
    id,
    defaultModel: "model-a",
    models: [{
      id: "model-a", name: "model-a", contextWindow: 128_000, maxOutput: 8_000,
      supportsTools: true, supportsVision: false, supportsThinking: opts.supportsThinking,
    }],
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(plugin as any).buildThinkingOptions = (modelId: string, budget: number) => {
    opts.onBuildThinkingOptions?.(modelId, budget)
    return budget > 0 ? { mock: { budget } } : null
  }
  ProviderRegistry.register(plugin)
  return plugin
}

describe("runAgent — Faz 2.2 adaptif reasoning effort", () => {
  beforeEach(() => {
    streamSpecs = [{ parts: [{ type: "text-delta", textDelta: "ok" }] }]
    streamCallCount = 0
  })

  it("escalation.enabled + karmaşık prompt -> buildThinkingOptions pozitif bir bütçeyle çağrılır", async () => {
    const calls: number[] = []
    registerMockPlugin("mock-escalation-a", {
      supportsThinking: true,
      onBuildThinkingOptions: (_id, budget) => calls.push(budget),
    })

    const { dir, cleanup, createFile } = createTempDir()
    createFile(".aurict/config.json", JSON.stringify({
      escalation: { enabled: true, maxReasoningEffort: 50_000 },
    }))

    try {
      await runAgent({
        provider: "mock-escalation-a",
        workdir: dir,
        // Uzun + actionable metin -> yüksek karmaşıklık skoru
        messages: [{ role: "user", content: "refactor and fix the failing tests across the whole module, " + "x".repeat(600) }],
      })
      expect(calls.length).toBe(1)
      expect(calls[0]!).toBeGreaterThan(0)
    } finally {
      cleanup()
    }
  })

  it("escalation kapalıyken (varsayılan) ve opts.effort verilmemişse buildThinkingOptions HİÇ çağrılmaz", async () => {
    const calls: number[] = []
    registerMockPlugin("mock-escalation-b", {
      supportsThinking: true,
      onBuildThinkingOptions: (_id, budget) => calls.push(budget),
    })

    const { dir, cleanup } = createTempDir() // .aurict/config.json yok -> escalation tanımsız/kapalı

    try {
      await runAgent({
        provider: "mock-escalation-b",
        workdir: dir,
        messages: [{ role: "user", content: "refactor and fix the failing tests, " + "x".repeat(600) }],
      })
      expect(calls.length).toBe(0)
    } finally {
      cleanup()
    }
  })

  it("escalation.maxReasoningEffort cap'i asla aşılmaz", async () => {
    const calls: number[] = []
    registerMockPlugin("mock-escalation-c", {
      supportsThinking: true,
      onBuildThinkingOptions: (_id, budget) => calls.push(budget),
    })

    const { dir, cleanup, createFile } = createTempDir()
    createFile(".aurict/config.json", JSON.stringify({
      escalation: { enabled: true, maxReasoningEffort: 3_000 },
    }))

    try {
      await runAgent({
        provider: "mock-escalation-c",
        workdir: dir,
        // Çok yüksek karmaşıklık skoru üretecek uzun bir metin
        messages: [{ role: "user", content: "x".repeat(3000) }],
      })
      expect(calls.length).toBe(1)
      expect(calls[0]!).toBeLessThanOrEqual(3_000)
    } finally {
      cleanup()
    }
  }, 10_000)

  it("model supportsThinking:false ise escalation açık olsa bile buildThinkingOptions çağrılmaz", async () => {
    const calls: number[] = []
    registerMockPlugin("mock-escalation-d", {
      supportsThinking: false,
      onBuildThinkingOptions: (_id, budget) => calls.push(budget),
    })

    const { dir, cleanup, createFile } = createTempDir()
    createFile(".aurict/config.json", JSON.stringify({
      escalation: { enabled: true, maxReasoningEffort: 50_000 },
    }))

    try {
      await runAgent({
        provider: "mock-escalation-d",
        workdir: dir,
        messages: [{ role: "user", content: "refactor and fix the failing tests, " + "x".repeat(600) }],
      })
      expect(calls.length).toBe(0)
    } finally {
      cleanup()
    }
  })

  it("opts.effort açıkça verilirse escalation'ı override eder (mevcut davranış korunur)", async () => {
    const calls: number[] = []
    registerMockPlugin("mock-escalation-e", {
      supportsThinking: true,
      onBuildThinkingOptions: (_id, budget) => calls.push(budget),
    })

    const { dir, cleanup, createFile } = createTempDir()
    createFile(".aurict/config.json", JSON.stringify({
      escalation: { enabled: true, maxReasoningEffort: 50_000 },
    }))

    try {
      await runAgent({
        provider: "mock-escalation-e",
        workdir: dir,
        effort: 4_000,
        messages: [{ role: "user", content: "x".repeat(3000) }], // yüksek skor olurdu ama effort override eder
      })
      expect(calls).toEqual([4_000])
    } finally {
      cleanup()
    }
  }, 10_000)
})

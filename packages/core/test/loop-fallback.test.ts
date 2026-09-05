/**
 * Faz 1 — Provider fallback'in gerçek stream tüketim yoluna bağlandığını
 * doğrulayan entegrasyon testi.
 *
 * "ai" paketi mock'lanır: streamText her çağrıda önceden tanımlı bir
 * fullStream senaryosu döner. Bu, runAgent'ın (1) birincil provider'da
 * fallback-tetikleyici bir hata aldığında fallback provider'a geçtiğini,
 * (2) onProviderFallback/onStreamRestart callback'lerini doğru sırayla
 * çağırdığını, (3) tool call sonrası hatada retry/fallback YAPMADIĞINI
 * (NonRetryableStreamError) uçtan uca kanıtlar.
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
  finishReason?: string
}

let streamCallCount = 0
let streamCallProviders: string[] = []
let streamSpecs: StreamSpec[] = []

mock.module("ai", () => ({
  tool: (def: unknown) => def,
  wrapLanguageModel: ({ model }: { model: unknown }) => model,
  streamText: (args: { model: unknown }) => {
    const spec = streamSpecs[streamCallCount] ?? streamSpecs[streamSpecs.length - 1]!
    // Mock model'ler kendi id'lerini taşır (bkz. createMockProvider) — hangi
    // provider'ın çağrıldığını attempt sırasına göre kaydet.
    streamCallProviders.push(String((args.model as { __providerId?: string })?.__providerId ?? "unknown"))
    streamCallCount++
    return {
      fullStream: (async function* () {
        for (const part of spec.parts) yield part
      })(),
      usage: Promise.resolve({}),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      experimental_providerMetadata: Promise.resolve(undefined) as any,
      finishReason: Promise.resolve(spec.finishReason ?? "stop"),
      response: Promise.resolve({ messages: [] }),
    }
  },
  generateText: async () => {
    throw new Error("generateText should not be called in this streaming test")
  },
}))

const { runAgent, withRetry } = await import("../src/agent/loop.js")
const { NonRetryableStreamError } = await import("../src/provider/fallback.js")

function registerMockPlugin(id: string, defaultModel: string) {
  const plugin = createMockProvider({
    id,
    defaultModel,
    models: [{
      id: defaultModel, name: defaultModel, contextWindow: 128_000, maxOutput: 8_000,
      supportsTools: true, supportsVision: false, supportsThinking: false,
    }],
  })
  // getModel'i override et: mock streamText'in hangi provider çağrıldığını
  // ayırt edebilmesi için model nesnesine provider id'sini damgala.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(plugin as any).getModel = (_modelId: string) => ({ __providerId: id })
  ProviderRegistry.register(plugin)
  return plugin
}

describe("withRetry — NonRetryableStreamError bypass", () => {
  it("never retries a NonRetryableStreamError, even if its message matches 429", async () => {
    let calls = 0
    await expect(
      withRetry(async () => {
        calls++
        throw new NonRetryableStreamError("429 rate limit — tool calls already ran")
      })
    ).rejects.toThrow("tool calls already ran")
    expect(calls).toBe(1)
  })

  it("still retries a plain 429 error (regression guard)", async () => {
    let calls = 0
    const result = await withRetry(async () => {
      calls++
      // "retry after 0 seconds" → parseRetryAfter 0ms bekler, test yavaşlamaz
      if (calls === 1) throw new Error("429 too many requests, retry after 0 seconds")
      return "ok"
    })
    expect(result).toBe("ok")
    expect(calls).toBe(2)
  })
})

describe("runAgent — Faz 1 provider fallback wiring", () => {
  beforeEach(() => {
    streamCallCount = 0
    streamCallProviders = []
    streamSpecs = []
  })

  it("switches to fallback provider when primary throws a trigger error before any tool call", async () => {
    registerMockPlugin("mock-primary-a", "model-a")
    registerMockPlugin("mock-fallback-a", "model-b")

    streamSpecs = [
      { parts: [{ type: "error", error: new Error("429 rate limit exceeded") }] },
      { parts: [{ type: "text-delta", textDelta: "fallback worked" }] },
    ]

    const { dir, cleanup, createFile } = createTempDir()
    createFile(".aurict/config.json", JSON.stringify({
      fallback: {
        enabled: true,
        providers: ["mock-fallback-a"],
        triggerOn: ["429"],
        maxRetries: 0,
        retryDelayMs: 5,
      },
    }))

    const restartCalls: number[] = []
    const fallbackCalls: Array<{ from: string; to: string }> = []

    try {
      const result = await runAgent({
        provider: "mock-primary-a",
        workdir: dir,
        messages: [{ role: "user", content: "hello" }],
        onStreamRestart: () => restartCalls.push(streamCallCount),
        onProviderFallback: (from, to) => fallbackCalls.push({ from, to }),
      })

      expect(result.text).toBe("fallback worked")
      expect(streamCallProviders).toEqual(["mock-primary-a", "mock-fallback-a"])
      expect(fallbackCalls).toEqual([{ from: "mock-primary-a", to: "mock-fallback-a" }])
      // Restart yalnızca 2. denemeden önce tetiklenmeli (1. deneme henüz yapılmadan önce değil)
      expect(restartCalls.length).toBe(1)
    } finally {
      cleanup()
    }
  })

  it("does not retry or switch providers once a tool call has run in the attempt", async () => {
    registerMockPlugin("mock-primary-b", "model-a")
    registerMockPlugin("mock-fallback-b", "model-b")

    streamSpecs = [
      {
        parts: [
          { type: "tool-call", toolCallId: "t1", toolName: "read", args: {} },
          { type: "tool-result", toolCallId: "t1", result: "file contents" },
          { type: "error", error: new Error("429 rate limit exceeded") },
        ],
      },
    ]

    const { dir, cleanup, createFile } = createTempDir()
    createFile(".aurict/config.json", JSON.stringify({
      fallback: {
        enabled: true,
        providers: ["mock-fallback-b"],
        triggerOn: ["429"],
        maxRetries: 0,
        retryDelayMs: 5,
      },
    }))

    try {
      await expect(runAgent({
        provider: "mock-primary-b",
        workdir: dir,
        messages: [{ role: "user", content: "hello" }],
      })).rejects.toThrow(/not auto-retried/)

      // Tek bir attempt yapıldı — fallback'e geçmedi, retry etmedi
      expect(streamCallProviders).toEqual(["mock-primary-b"])
    } finally {
      cleanup()
    }
  })

  it("runs a single attempt with no restart/fallback callbacks when fallback is disabled", async () => {
    registerMockPlugin("mock-primary-c", "model-a")

    streamSpecs = [
      { parts: [{ type: "text-delta", textDelta: "plain success" }] },
    ]

    const { dir, cleanup } = createTempDir()
    const restartCalls: number[] = []

    try {
      const result = await runAgent({
        provider: "mock-primary-c",
        workdir: dir,
        messages: [{ role: "user", content: "hello" }],
        onStreamRestart: () => restartCalls.push(1),
      })

      expect(result.text).toBe("plain success")
      expect(streamCallProviders).toEqual(["mock-primary-c"])
      expect(restartCalls.length).toBe(0)
    } finally {
      cleanup()
    }
  })
})

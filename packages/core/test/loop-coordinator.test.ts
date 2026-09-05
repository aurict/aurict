/**
 * Faz 3A — runAgent'ın coordinator promptunu karmaşıklık-kapılı enjekte ettiğini
 * uçtan uca doğrular (onPromptDiagnostics callback'i üzerinden section adlarını
 * gözlemleyerek — runtimeSystemSections doğrudan dışa açık değil).
 */
import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test"
import { ProviderRegistry } from "../src/provider/registry.js"
import { createMockProvider, createTempDir } from "./helpers.js"
import { clearPromptSectionCache } from "../src/agent/prompt-sections.js"
import type { PromptDiagnostics } from "../src/agent/prompt-diagnostics.js"

// runAgent() gerçek prompt-section cache'ini kullanıyor (paylaşılan modül state) —
// başka test dosyalarına sızmaması için her testten sonra temizle.
afterEach(() => clearPromptSectionCache())

let streamCallCount = 0

mock.module("ai", () => ({
  tool: (def: unknown) => def,
  wrapLanguageModel: ({ model }: { model: unknown }) => model,
  streamText: () => {
    streamCallCount++
    return {
      fullStream: (async function* () {
        yield { type: "text-delta", textDelta: "ok" }
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

function hasSection(diag: PromptDiagnostics | undefined, name: string): boolean {
  return !!diag?.sections.some((s) => s.name === name)
}

describe("runAgent — Faz 3A coordinator karmaşıklık-kapılı enjeksiyon", () => {
  beforeEach(() => {
    streamCallCount = 0
    ProviderRegistry.register(createMockProvider({
      id: "mock-coord-provider",
      defaultModel: "model-a",
      models: [{
        id: "model-a",
        name: "Coordinator Test Model",
        contextWindow: 128_000,
        maxOutput: 8_000,
        supportsTools: true,
        supportsVision: false,
        supportsThinking: false,
      }],
    }))
  })

  it("kısa/basit bir prompt için (varsayılan auto mode) coordinator enjekte edilmez", async () => {
    const { dir, cleanup } = createTempDir()
    let diagnostics: PromptDiagnostics | undefined
    try {
      await runAgent({
        provider: "mock-coord-provider",
        workdir: dir,
        messages: [{ role: "user", content: "hi" }],
        onPromptDiagnostics: (d) => { diagnostics = d },
      })
      expect(hasSection(diagnostics, "coordinator")).toBe(false)
    } finally {
      cleanup()
    }
  })

  it("çok-boyutlu bir prompt için (varsayılan auto mode) coordinator enjekte edilir", async () => {
    const { dir, cleanup } = createTempDir()
    let diagnostics: PromptDiagnostics | undefined
    let selectedTools: string[] = []
    try {
      await runAgent({
        provider: "mock-coord-provider",
        workdir: dir,
        messages: [{ role: "user", content: "analyze this for security, performance and architecture" }],
        onPromptDiagnostics: (d) => { diagnostics = d },
        onToolSelection: (selection) => { selectedTools = selection.toolIds },
      })
      expect(hasSection(diagnostics, "coordinator")).toBe(true)
      expect(selectedTools).toContain("subagent")
    } finally {
      cleanup()
    }
  })

  it("coordinatorMode:true açık kullanıcı tercihi olarak basit promptta da coordinator ve subagent aracını etkinleştirir", async () => {
    const { dir, cleanup } = createTempDir()
    let diagnostics: PromptDiagnostics | undefined
    let selectedTools: string[] = []
    try {
      await runAgent({
        provider: "mock-coord-provider",
        workdir: dir,
        messages: [{ role: "user", content: "hi" }],
        coordinatorMode: true,
        onPromptDiagnostics: (d) => { diagnostics = d },
        onToolSelection: (selection) => { selectedTools = selection.toolIds },
      })
      expect(hasSection(diagnostics, "coordinator")).toBe(true)
      expect(selectedTools).toContain("subagent")
    } finally {
      cleanup()
    }
  })

  it("orchestration.mode:'off' iken çok-boyutlu promptta bile enjekte edilmez", async () => {
    const { dir, cleanup, createFile } = createTempDir()
    createFile(".aurict/config.json", JSON.stringify({ orchestration: { mode: "off" } }))
    let diagnostics: PromptDiagnostics | undefined
    try {
      await runAgent({
        provider: "mock-coord-provider",
        workdir: dir,
        messages: [{ role: "user", content: "analyze this for security, performance and architecture" }],
        onPromptDiagnostics: (d) => { diagnostics = d },
      })
      expect(hasSection(diagnostics, "coordinator")).toBe(false)
    } finally {
      cleanup()
    }
  })

  it("orchestration.mode:'always' iken kısa/basit bir promptta bile enjekte edilir (geriye dönük uyum)", async () => {
    const { dir, cleanup, createFile } = createTempDir()
    createFile(".aurict/config.json", JSON.stringify({ orchestration: { mode: "always" } }))
    let diagnostics: PromptDiagnostics | undefined
    try {
      await runAgent({
        provider: "mock-coord-provider",
        workdir: dir,
        messages: [{ role: "user", content: "hi" }],
        onPromptDiagnostics: (d) => { diagnostics = d },
      })
      expect(hasSection(diagnostics, "coordinator")).toBe(true)
    } finally {
      cleanup()
    }
  })

  it("coordinatorMode:false (kullanıcı /coordinator ile kapattı) her zaman kazanır — config'e bakılmaksızın", async () => {
    const { dir, cleanup, createFile } = createTempDir()
    createFile(".aurict/config.json", JSON.stringify({ orchestration: { mode: "always" } }))
    let diagnostics: PromptDiagnostics | undefined
    try {
      await runAgent({
        provider: "mock-coord-provider",
        workdir: dir,
        messages: [{ role: "user", content: "analyze security, performance, architecture" }],
        coordinatorMode: false,
        onPromptDiagnostics: (d) => { diagnostics = d },
      })
      expect(hasSection(diagnostics, "coordinator")).toBe(false)
    } finally {
      cleanup()
    }
  })
})

/**
 * Test helpers — Faz 0 ve sonrası testler için ortak yardımcılar.
 * 
 * Mock provider, mock tool, test context oluşturucuları.
 */

import { describe, expect, it } from "bun:test"
import { z } from "zod"
import type { ToolDef, ToolContext, ExecuteResult } from "../src/tool/types.js"
import type { ProviderPlugin, ModelInfo } from "../src/provider/plugin.js"
import type { LanguageModel } from "ai"

// ─── Mock Tool ────────────────────────────────────────────────────────────────

export interface MockToolOptions {
  id?:          string
  description?: string
  handler?:     (args: Record<string, unknown>, ctx: ToolContext) => Promise<ExecuteResult>
  parameters?:  z.AnyZodObject
  timeoutMs?:   number
}

/**
 * Test için mock tool oluşturur.
 * 
 *   const tool = createMockTool({
 *     id: "read",
 *     handler: async (args) => ({ output: "file content" }),
 *   })
 */
export function createMockTool(opts: MockToolOptions = {}): ToolDef {
  return {
    id:          opts.id ?? "mock-tool",
    description: opts.description ?? "A mock tool for testing",
    parameters:  opts.parameters ?? z.object({ input: z.string().optional() }),
    ...(opts.timeoutMs !== undefined ? { timeoutMs: opts.timeoutMs } : {}),
    execute: opts.handler ?? (async () => ({ output: "mock output" })),
  }
}

// ─── Mock ToolContext ─────────────────────────────────────────────────────────

export interface MockContextOptions {
  sessionId?:  string
  workdir?:    string
  signal?:     AbortSignal
  provider?:   string
  model?:      string
  isSubagent?: boolean
}

/**
 * Test için mock ToolContext oluşturur.
 */
export function createMockContext(opts: MockContextOptions = {}): ToolContext {
  const ac = new AbortController()
  return {
    sessionId: opts.sessionId ?? "test-session-id",
    workdir:   opts.workdir   ?? "/tmp/test-workdir",
    signal:    opts.signal    ?? ac.signal,
    provider:  opts.provider  ?? "anthropic",
    model:     opts.model     ?? "claude-sonnet-4-6",
    ...(opts.isSubagent !== undefined ? { isSubagent: opts.isSubagent } : {}),
  }
}

// ─── Mock Provider ────────────────────────────────────────────────────────────

export interface MockProviderOptions {
  id?:           string
  name?:         string
  defaultModel?: string
  models?:       ModelInfo[]
}

/**
 * Test için mock ProviderPlugin oluşturur.
 * Gerçek LLM çağrısı yapmaz — sadece interface'i implement eder.
 */
export function createMockProvider(opts: MockProviderOptions = {}): ProviderPlugin {
  const models: ModelInfo[] = opts.models ?? [
    {
      id:              "mock-model",
      name:            "Mock Model",
      contextWindow:   128_000,
      maxOutput:       8_000,
      supportsTools:   true,
      supportsVision:  false,
      supportsThinking: false,
    },
  ]

  return {
    id:           opts.id           ?? "mock-provider",
    name:         opts.name         ?? "Mock Provider",
    sdkType:      "openai-compatible" as const,
    defaultModel: () => opts.defaultModel ?? "mock-model",
    listModels:   () => models,
    getModel:     (_modelId: string) => {
      // Minimal LanguageModel stub — gerçek çağrı yapmaz
      return {} as LanguageModel
    },
    supportsStreaming: true,
    tokenizerEncoding: () => "cl100k_base",
    buildThinkingOptions: () => null,
    listModelsRemote: async () => models,
  } as unknown as ProviderPlugin
}

// ─── Assertion Helpers ────────────────────────────────────────────────────────

/** ExecuteResult'un başarılı olduğunu doğrular. */
export function expectSuccess(result: ExecuteResult): void {
  expect(result.error).toBeUndefined()
  expect(result.output).toBeTruthy()
}

/** ExecuteResult'un hata içerdiğini doğrular. */
export function expectError(result: ExecuteResult, pattern?: string | RegExp): void {
  expect(result.error).toBeTruthy()
  if (pattern) {
    if (typeof pattern === "string") {
      expect(result.error).toContain(pattern)
    } else {
      expect(result.error).toMatch(pattern)
    }
  }
}

/** Belirli bir süre içinde tamamlanacağını doğrular. */
export async function expectCompletesWithin<T>(
  fn: () => Promise<T>,
  maxMs: number,
): Promise<T> {
  const start = Date.now()
  const result = await fn()
  const elapsed = Date.now() - start
  expect(elapsed).toBeLessThan(maxMs)
  return result
}

// ─── Temp Directory Helpers ───────────────────────────────────────────────────

import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

/**
 * Geçici test dizini oluşturur. afterEach'te otomatik temizlenir.
 * 
 *   const { dir, cleanup, createFile } = await createTempDir()
 *   createFile("test.ts", "const x = 1")
 *   // ... test yap ...
 *   cleanup()
 */
export function createTempDir(): {
  dir:       string
  cleanup:   () => void
  createFile: (relativePath: string, content: string) => string
} {
  const dir = mkdtempSync(join(tmpdir(), "aurict-test-"))

  const cleanup = () => {
    try { rmSync(dir, { recursive: true, force: true }) } catch { /* ignore */ }
  }

  const createFile = (relativePath: string, content: string): string => {
    const fullPath = join(dir, relativePath)
    mkdirSync(join(fullPath, ".."), { recursive: true })
    writeFileSync(fullPath, content, "utf8")
    return fullPath
  }

  return { dir, cleanup, createFile }
}

// ─── Re-export test utilities ─────────────────────────────────────────────────

export { describe, it, expect }

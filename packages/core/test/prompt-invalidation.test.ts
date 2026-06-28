import { afterEach, describe, expect, it } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { invalidatePromptSectionsForChangedFile } from "../src/agent/prompt-invalidation.js"
import {
  clearPromptSectionCache,
  promptSectionCacheStats,
  resolvePromptSections,
  sessionPromptSection,
} from "../src/agent/prompt-sections.js"

let tmpDir: string

afterEach(() => {
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true })
  clearPromptSectionCache()
})

describe("prompt section invalidation", () => {
  it("invalidates project instructions when AGENTS.md changes", async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "aurict-prompt-invalidate-"))
    await resolvePromptSections([
      sessionPromptSection("project_instructions", () => "instructions"),
      sessionPromptSection("project_context", () => "context"),
    ], tmpDir)

    invalidatePromptSectionsForChangedFile(tmpDir, "AGENTS.md")

    expect(promptSectionCacheStats().entries).toBe(1)
  })

  it("invalidates project context when .aurict files change", async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "aurict-prompt-invalidate-"))
    await resolvePromptSections([
      sessionPromptSection("project_instructions", () => "instructions"),
      sessionPromptSection("project_context", () => "context"),
    ], tmpDir)

    invalidatePromptSectionsForChangedFile(tmpDir, ".aurict/architecture.md")

    expect(promptSectionCacheStats().entries).toBe(1)
  })

  it("ignores unrelated files", async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "aurict-prompt-invalidate-"))
    await resolvePromptSections([
      sessionPromptSection("project_instructions", () => "instructions"),
      sessionPromptSection("project_context", () => "context"),
    ], tmpDir)

    invalidatePromptSectionsForChangedFile(tmpDir, "src/index.ts")

    expect(promptSectionCacheStats().entries).toBe(2)
  })
})

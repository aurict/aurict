import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { mkdtempSync, rmSync, writeFileSync, utimesSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { semanticCache } from "../src/tool/semantic-cache.js"

describe("SemanticCache", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "aurict-cache-"))
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
    semanticCache.clear()
  })

  it("caches and retrieves file contents", async () => {
    const filePath = join(tmpDir, "test.ts")
    const content = "const x = 5;"
    writeFileSync(filePath, content)

    // First retrieve should be null (cache miss)
    let cached = await semanticCache.get<string>(filePath)
    expect(cached).toBeNull()

    // Store in cache
    await semanticCache.set(filePath, content, content)

    // Second retrieve should return cached content
    cached = await semanticCache.get<string>(filePath)
    expect(cached).toBe(content)
  })

  it("invalidates cache on file modification", async () => {
    const filePath = join(tmpDir, "test.ts")
    const content = "const x = 5;"
    writeFileSync(filePath, content)

    await semanticCache.set(filePath, content, content)

    // Modify file and update mtime manually
    const updatedContent = "const x = 10;"
    writeFileSync(filePath, updatedContent)
    
    // Set a future mtime to guarantee difference
    const futureTime = Date.now() / 1000 + 10
    utimesSync(filePath, futureTime, futureTime)

    // Retrieve should be null due to invalidation
    const cached = await semanticCache.get<string>(filePath)
    expect(cached).toBeNull()
  })
})

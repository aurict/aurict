import { describe, it, expect, beforeEach } from "bun:test"
import { PrefetchManager, extractPrefetchHints } from "../src/util/prefetch.js"
import { createTempDir } from "./helpers.js"

describe("PrefetchManager", () => {
  let manager: PrefetchManager

  beforeEach(() => {
    manager = new PrefetchManager()
  })

  describe("prefetch", () => {
    it("caches file content on file-read hint", async () => {
      const { dir, cleanup, createFile } = createTempDir()
      try {
        createFile("test.ts", "const x = 5")

        await manager.prefetch({
          hint: "file-read",
          data: { path: "test.ts" },
          workdir: dir,
        })

        const result = manager.getPrefetched(`${dir}/test.ts`)
        expect(result).not.toBeNull()
        expect(result!.content).toBe("const x = 5")
      } finally {
        cleanup()
      }
    })

    it("caches multiple files from grep-result", async () => {
      const { dir, cleanup, createFile } = createTempDir()
      try {
        createFile("a.ts", "file a")
        createFile("b.ts", "file b")

        await manager.prefetch({
          hint: "grep-result",
          data: { files: ["a.ts", "b.ts"] },
          workdir: dir,
        })

      expect(manager.getPrefetched(`${dir}/a.ts`)).not.toBeNull()
        expect(manager.getPrefetched(`${dir}/b.ts`)).not.toBeNull()
      } finally {
        cleanup()
      }
    })

    it("skips large files", async () => {
      const { dir, cleanup, createFile } = createTempDir()
      try {
        // 100KB'den büyük dosya
        createFile("large.ts", "x".repeat(150_000))

        await manager.prefetch({
          hint: "file-read",
          data: { path: "large.ts" },
          workdir: dir,
        })

        expect(manager.getPrefetched(`${dir}/large.ts`)).toBeNull()
      } finally {
        cleanup()
      }
    })

    it("handles non-existent files gracefully", async () => {
      const { dir, cleanup } = createTempDir()
      try {
        await manager.prefetch({
          hint: "file-read",
          data: { path: "nonexistent.ts" },
          workdir: dir,
        })

        // Hata vermemeli
        expect(manager.getPrefetched(`${dir}/nonexistent.ts`)).toBeNull()
      } finally {
        cleanup()
      }
    })
  })

  describe("getStats", () => {
    it("tracks prefetch count", async () => {
      const { dir, cleanup, createFile } = createTempDir()
      try {
        createFile("test.ts", "content")

        await manager.prefetch({
          hint: "file-read",
          data: { path: "test.ts" },
          workdir: dir,
        })

        const stats = manager.getStats()
        expect(stats.prefetchCount).toBe(1)
      } finally {
        cleanup()
      }
    })

    it("tracks hit count", async () => {
      const { dir, cleanup, createFile } = createTempDir()
      try {
        createFile("test.ts", "content")

        await manager.prefetch({
          hint: "file-read",
          data: { path: "test.ts" },
          workdir: dir,
        })

        manager.getPrefetched(`${dir}/test.ts`)
        manager.getPrefetched(`${dir}/test.ts`)

        const stats = manager.getStats()
        expect(stats.hitCount).toBe(2)
        expect(stats.prefetchCount).toBe(1)
        expect(stats.hitRate).toBe(2) // 2 hits / 1 prefetch
      } finally {
        cleanup()
      }
    })
  })

  describe("clear", () => {
    it("clears cache and stats", async () => {
      const { dir, cleanup, createFile } = createTempDir()
      try {
        createFile("test.ts", "content")

        await manager.prefetch({
          hint: "file-read",
          data: { path: "test.ts" },
          workdir: dir,
        })

        manager.clear()

        const stats = manager.getStats()
        expect(stats.prefetchCount).toBe(0)
        expect(stats.hitCount).toBe(0)
      } finally {
        cleanup()
      }
    })
  })
})

describe("extractPrefetchHints", () => {
  it("returns file-read hint for read tool", () => {
    const hints = extractPrefetchHints("read", { path: "file.ts" }, "content")
    expect(hints).toContain("file-read")
  })

  it("returns grep-result hint for grep tool with files", () => {
    const result = "file1.ts:10: match\nfile2.ts:20: match"
    const hints = extractPrefetchHints("grep", { pattern: "test" }, result)
    expect(hints).toContain("grep-result")
  })

  it("returns glob-result hint for glob tool with files", () => {
    const result = "file1.ts\nfile2.ts\nfile3.ts"
    const hints = extractPrefetchHints("glob", { pattern: "**/*.ts" }, result)
    expect(hints).toContain("glob-result")
  })

  it("returns edit-target hint for edit tool", () => {
    const hints = extractPrefetchHints("edit", { path: "file.ts" }, "edited")
    expect(hints).toContain("edit-target")
  })

  it("returns empty array for unknown tool", () => {
    const hints = extractPrefetchHints("unknown", {}, "result")
    expect(hints.length).toBe(0)
  })
})

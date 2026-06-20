import { describe, it, expect } from "bun:test"
import { hashArgs, hashString, hashFileQuick, hashFileContent } from "../src/util/hash.js"
import { createTempDir } from "./helpers.js"

describe("hashArgs", () => {
  it("same args produce same hash", () => {
    const a = hashArgs({ path: "foo.ts", offset: 1 })
    const b = hashArgs({ path: "foo.ts", offset: 1 })
    expect(a).toBe(b)
  })

  it("key order does not affect hash", () => {
    const a = hashArgs({ b: 2, a: 1 })
    const b = hashArgs({ a: 1, b: 2 })
    expect(a).toBe(b)
  })

  it("different args produce different hash", () => {
    const a = hashArgs({ path: "foo.ts" })
    const b = hashArgs({ path: "bar.ts" })
    expect(a).not.toBe(b)
  })

  it("handles nested objects", () => {
    const a = hashArgs({ config: { nested: { value: 42 } } })
    const b = hashArgs({ config: { nested: { value: 42 } } })
    expect(a).toBe(b)
  })

  it("handles arrays", () => {
    const a = hashArgs({ items: [1, 2, 3] })
    const b = hashArgs({ items: [1, 2, 3] })
    expect(a).toBe(b)

    const c = hashArgs({ items: [3, 2, 1] })
    expect(a).not.toBe(c)
  })

  it("handles null and undefined", () => {
    const a = hashArgs({ x: null })
    const b = hashArgs({ x: null })
    expect(a).toBe(b)
  })

  it("returns 16-char hex string", () => {
    const hash = hashArgs({ test: true })
    expect(hash).toMatch(/^[0-9a-f]{16}$/)
  })

  it("handles empty object", () => {
    const hash = hashArgs({})
    expect(hash).toBeTruthy()
    expect(hash.length).toBe(16)
  })
})

describe("hashString", () => {
  it("same string produces same hash", () => {
    expect(hashString("hello")).toBe(hashString("hello"))
  })

  it("different strings produce different hashes", () => {
    expect(hashString("hello")).not.toBe(hashString("world"))
  })

  it("returns 12-char hex string", () => {
    expect(hashString("test")).toMatch(/^[0-9a-f]{12}$/)
  })
})

describe("hashFileQuick", () => {
  it("returns size:mtime for existing file", async () => {
    const { dir, cleanup, createFile } = createTempDir()
    try {
      createFile("test.txt", "hello world")
      const hash = await hashFileQuick(`${dir}/test.txt`)
      expect(hash).toMatch(/^\d+:\d+\.?\d*$/)
    } finally {
      cleanup()
    }
  })

  it("returns empty string for non-existent file", async () => {
    const hash = await hashFileQuick("/nonexistent/file.txt")
    expect(hash).toBe("")
  })
})

describe("hashFileContent", () => {
  it("returns content hash for existing file", async () => {
    const { dir, cleanup, createFile } = createTempDir()
    try {
      createFile("test.txt", "hello world")
      const hash = await hashFileContent(`${dir}/test.txt`)
      expect(hash).toMatch(/^[0-9a-f]{16}$/)
    } finally {
      cleanup()
    }
  })

  it("same content produces same hash", async () => {
    const { dir, cleanup, createFile } = createTempDir()
    try {
      createFile("a.txt", "identical content")
      createFile("b.txt", "identical content")
      const hashA = await hashFileContent(`${dir}/a.txt`)
      const hashB = await hashFileContent(`${dir}/b.txt`)
      expect(hashA).toBe(hashB)
    } finally {
      cleanup()
    }
  })

  it("returns empty string for non-existent file", async () => {
    const hash = await hashFileContent("/nonexistent/file.txt")
    expect(hash).toBe("")
  })
})

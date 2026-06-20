import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { snapshotManager } from "../src/snapshot/snapshot.js"

let tmpDir: string

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "aurict-snap-"))
  snapshotManager.clear()
})

afterEach(() => {
  snapshotManager.clear()
  rmSync(tmpDir, { recursive: true, force: true })
})

// ─── takeSnapshot + undoLast ─────────────────────────────────────────────────

describe("snapshotManager.takeSnapshot + undoLast", () => {
  it("restores file content to its snapshot state", async () => {
    const file = join(tmpDir, "hello.ts")
    writeFileSync(file, "original")
    await snapshotManager.takeSnapshot(file)
    writeFileSync(file, "modified")
    await snapshotManager.undoLast()
    expect(readFileSync(file, "utf8")).toBe("original")
  })

  it("undoLast returns the restored file path", async () => {
    const file = join(tmpDir, "foo.txt")
    writeFileSync(file, "data")
    await snapshotManager.takeSnapshot(file)
    const result = await snapshotManager.undoLast()
    expect(result).not.toBeNull()
    expect(result).toContain("foo.txt")
  })

  it("undoLast on empty history returns null", async () => {
    const result = await snapshotManager.undoLast()
    expect(result).toBeNull()
  })

  it("snapshots are undone in LIFO order", async () => {
    const a = join(tmpDir, "a.txt")
    const b = join(tmpDir, "b.txt")
    writeFileSync(a, "a-original")
    writeFileSync(b, "b-original")
    await snapshotManager.takeSnapshot(a)
    await snapshotManager.takeSnapshot(b)
    writeFileSync(a, "a-modified")
    writeFileSync(b, "b-modified")
    // First undo restores b (last pushed)
    await snapshotManager.undoLast()
    expect(readFileSync(b, "utf8")).toBe("b-original")
    expect(readFileSync(a, "utf8")).toBe("a-modified") // a still modified
    // Second undo restores a
    await snapshotManager.undoLast()
    expect(readFileSync(a, "utf8")).toBe("a-original")
  })

  it("undoLast decrements history length", async () => {
    const file = join(tmpDir, "x.txt")
    writeFileSync(file, "x")
    await snapshotManager.takeSnapshot(file)
    await snapshotManager.takeSnapshot(file)
    expect(snapshotManager.getHistoryLength()).toBe(2)
    await snapshotManager.undoLast()
    expect(snapshotManager.getHistoryLength()).toBe(1)
  })
})

// ─── ENOENT (new file) ───────────────────────────────────────────────────────

describe("snapshotManager — non-existent file (ENOENT)", () => {
  it("snapshots a non-existent file without throwing", async () => {
    const file = join(tmpDir, "new-file.ts")
    await snapshotManager.takeSnapshot(file) // no throw
    expect(snapshotManager.getHistoryLength()).toBe(1)
  })

  it("undoLast on new-file snapshot writes empty string", async () => {
    const file = join(tmpDir, "new-file.ts")
    await snapshotManager.takeSnapshot(file)
    writeFileSync(file, "some content added later")
    await snapshotManager.undoLast()
    expect(readFileSync(file, "utf8")).toBe("")
  })
})

// ─── mark + restoreToMark ────────────────────────────────────────────────────

describe("snapshotManager.mark + restoreToMark", () => {
  it("restores only snapshots taken after mark", async () => {
    const a = join(tmpDir, "a.txt")
    const b = join(tmpDir, "b.txt")
    writeFileSync(a, "a-v1")
    writeFileSync(b, "b-v1")
    await snapshotManager.takeSnapshot(a)     // before mark
    const mark = snapshotManager.mark()
    await snapshotManager.takeSnapshot(b)     // after mark
    writeFileSync(a, "a-v2")
    writeFileSync(b, "b-v2")
    await snapshotManager.restoreToMark(mark)
    expect(readFileSync(b, "utf8")).toBe("b-v1")  // restored
    expect(readFileSync(a, "utf8")).toBe("a-v2")  // not touched
  })

  it("restoreToMark returns list of restored paths", async () => {
    const file = join(tmpDir, "c.txt")
    writeFileSync(file, "original")
    const mark = snapshotManager.mark()
    await snapshotManager.takeSnapshot(file)
    writeFileSync(file, "changed")
    const restored = await snapshotManager.restoreToMark(mark)
    expect(restored).toHaveLength(1)
    expect(restored[0]).toContain("c.txt")
  })

  it("restoreToMark at current end restores nothing", async () => {
    const file = join(tmpDir, "d.txt")
    writeFileSync(file, "data")
    await snapshotManager.takeSnapshot(file)
    const mark = snapshotManager.mark() // mark at end
    const restored = await snapshotManager.restoreToMark(mark)
    expect(restored).toHaveLength(0)
  })

  it("restoreToMark(0) restores all snapshots", async () => {
    const a = join(tmpDir, "e.txt")
    const b = join(tmpDir, "f.txt")
    writeFileSync(a, "a-orig")
    writeFileSync(b, "b-orig")
    await snapshotManager.takeSnapshot(a)
    await snapshotManager.takeSnapshot(b)
    writeFileSync(a, "a-new")
    writeFileSync(b, "b-new")
    const restored = await snapshotManager.restoreToMark(0)
    expect(restored).toHaveLength(2)
    expect(readFileSync(a, "utf8")).toBe("a-orig")
    expect(readFileSync(b, "utf8")).toBe("b-orig")
  })

  it("restoreToMark empties history up to mark", async () => {
    const file = join(tmpDir, "g.txt")
    writeFileSync(file, "data")
    const mark = snapshotManager.mark() // mark = 0
    await snapshotManager.takeSnapshot(file)
    await snapshotManager.takeSnapshot(file)
    await snapshotManager.restoreToMark(mark)
    expect(snapshotManager.getHistoryLength()).toBe(0)
  })
})

// ─── getHistoryLength + clear ────────────────────────────────────────────────

describe("snapshotManager.getHistoryLength + clear", () => {
  it("starts at 0", () => {
    expect(snapshotManager.getHistoryLength()).toBe(0)
  })

  it("increments with each snapshot", async () => {
    const file = join(tmpDir, "h.txt")
    writeFileSync(file, "h")
    await snapshotManager.takeSnapshot(file)
    await snapshotManager.takeSnapshot(file)
    expect(snapshotManager.getHistoryLength()).toBe(2)
  })

  it("clear() empties history to 0", async () => {
    const file = join(tmpDir, "i.txt")
    writeFileSync(file, "i")
    await snapshotManager.takeSnapshot(file)
    snapshotManager.clear()
    expect(snapshotManager.getHistoryLength()).toBe(0)
  })

  it("mark() equals getHistoryLength()", async () => {
    const file = join(tmpDir, "j.txt")
    writeFileSync(file, "j")
    await snapshotManager.takeSnapshot(file)
    expect(snapshotManager.mark()).toBe(snapshotManager.getHistoryLength())
  })
})

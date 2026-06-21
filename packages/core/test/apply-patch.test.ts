import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { applyPatchTool } from "../src/tool/built-in/apply-patch.js"
import { snapshotManager } from "../src/snapshot/snapshot.js"
import type { ToolContext } from "../src/tool/types.js"

let tmpDir: string
let ctx: ToolContext
const originalStorageDir = snapshotManager.getStorageDir()

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "aurict-apply-patch-"))
  snapshotManager.setStorageDir(join(tmpDir, ".aurict", "snapshots"))
  snapshotManager.clear()
  ctx = {
    sessionId: "test",
    workdir: tmpDir,
    signal: new AbortController().signal,
  }
})

afterEach(() => {
  snapshotManager.clear()
  snapshotManager.setStorageDir(originalStorageDir)
  rmSync(tmpDir, { recursive: true, force: true })
})

describe("apply_patch transaction safety", () => {
  it("does not modify earlier files when a later hunk fails validation", async () => {
    const a = join(tmpDir, "a.txt")
    const b = join(tmpDir, "b.txt")
    writeFileSync(a, "one\n")
    writeFileSync(b, "alpha\n")

    const result = await applyPatchTool.execute({
      patchText: `*** Begin Patch
*** Update File: a.txt
@@
-one
+two
*** Update File: b.txt
@@
-missing
+beta
*** End Patch`,
    }, ctx)

    expect(result.error).toContain("Patch validation failed")
    expect(readFileSync(a, "utf8")).toBe("one\n")
    expect(readFileSync(b, "utf8")).toBe("alpha\n")
  })

  it("does not create added files when a later hunk fails validation", async () => {
    const existing = join(tmpDir, "existing.txt")
    const added = join(tmpDir, "added.txt")
    writeFileSync(existing, "original\n")

    const result = await applyPatchTool.execute({
      patchText: `*** Begin Patch
*** Add File: added.txt
+created
*** Update File: existing.txt
@@
-missing
+changed
*** End Patch`,
    }, ctx)

    expect(result.error).toContain("Patch validation failed")
    expect(existsSync(added)).toBe(false)
    expect(readFileSync(existing, "utf8")).toBe("original\n")
  })

  it("deletes a new file when undoing the patch snapshot", async () => {
    const added = join(tmpDir, "added.txt")

    const result = await applyPatchTool.execute({
      patchText: `*** Begin Patch
*** Add File: added.txt
+created
*** End Patch`,
    }, ctx)

    expect(result.error).toBeUndefined()
    expect(readFileSync(added, "utf8")).toBe("created")

    await snapshotManager.undoLast()

    expect(existsSync(added)).toBe(false)
  })
})

import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { applyPatchTool } from "../src/tool/built-in/apply-patch.js"
import { executeTool, ExecutorEvents } from "../src/tool/executor.js"
import { PermissionGate, PermissionStore } from "../src/permission/store.js"
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
  PermissionStore.clear()
  PermissionGate.cancelPending()
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

  it("returns changed file metadata after applying a patch", async () => {
    const file = join(tmpDir, "src.txt")
    writeFileSync(file, "one\n")

    const result = await applyPatchTool.execute({
      patchText: `*** Begin Patch
*** Update File: src.txt
@@
-one
+two
*** End Patch`,
    }, ctx)

    expect(result.error).toBeUndefined()
    expect(result.output).toContain("Changed files: src.txt")
    expect(result.metadata?.changedFiles).toEqual(["src.txt"])
    expect(result.metadata?.patch?.added).toBe(1)
    expect(result.metadata?.patch?.removed).toBe(1)
  })

  it("does not allow apply_patch to bypass GateGuard denied paths", async () => {
    const result = await executeTool(applyPatchTool, {
      patchText: `*** Begin Patch
*** Add File: .aurict/config.json
+{"provider":"test"}
*** End Patch`,
    }, ctx)

    expect(result.error).toContain("GateGuard")
    expect(result.error).toContain(".aurict/config.json")
    expect(existsSync(join(tmpDir, ".aurict", "config.json"))).toBe(false)
  })

  it("applies only selected files when permission returns partial approval", async () => {
    const a = join(tmpDir, "a.txt")
    const b = join(tmpDir, "b.txt")
    writeFileSync(a, "one\n")
    writeFileSync(b, "alpha\n")

    const off = ExecutorEvents.on((event) => {
      setTimeout(() => {
        PermissionGate.respond(event.request.id, {
          decision: "allow_partial",
          approvedFiles: ["a.txt"],
        })
      }, 0)
    })

    const result = await executeTool(applyPatchTool, {
      patchText: `*** Begin Patch
*** Update File: a.txt
@@
-one
+two
*** Update File: b.txt
@@
-alpha
+beta
*** End Patch`,
    }, ctx)

    off()

    expect(result.error).toBeUndefined()
    expect(readFileSync(a, "utf8")).toBe("two\n")
    expect(readFileSync(b, "utf8")).toBe("alpha\n")
    expect(result.metadata?.changedFiles).toEqual(["a.txt"])
  })
})

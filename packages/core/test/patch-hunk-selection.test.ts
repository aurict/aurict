import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { filterPatchTextByFiles, summarizePatchText } from "../src/tool/built-in/apply-patch-format.js"
import { applyPatchTool } from "../src/tool/built-in/apply-patch.js"
import { executeTool, ExecutorEvents } from "../src/tool/executor.js"
import { PermissionGate, PermissionStore } from "../src/permission/store.js"
import { sessionSnapshotScope, snapshotManager } from "../src/snapshot/snapshot.js"
import { patchPermissionMetadata } from "../src/tool/execution-helpers.js"
import type { ToolContext } from "../src/tool/types.js"

const PATCH = [
  "*** Begin Patch",
  "*** Update File: app.ts",
  "@@ function first",
  " function first() {",
  "-  return 1",
  "+  return 10",
  " }",
  "@@ function second",
  " function second() {",
  "-  return 2",
  "+  return 20",
  " }",
  "*** Add File: notes.md",
  "+hello",
  "*** End Patch",
].join("\n")

describe("hunk-level patch selection", () => {
  it("summarizes update chunks with their anchors", () => {
    const summary = summarizePatchText(PATCH)
    expect(summary.files[0]!.hunks).toEqual([
      { context: "function first", added: 1, removed: 1 },
      { context: "function second", added: 1, removed: 1 },
    ])
    expect(summary.files[1]!.hunks).toBeUndefined()
    expect(patchPermissionMetadata(summary, PATCH, true).files![0]!.hunks).toHaveLength(2)
  })

  it("keeps only the selected chunks of an update and whole other files", () => {
    const filtered = filterPatchTextByFiles(PATCH, ["app.ts", "notes.md"], { "app.ts": [1] })
    expect(filtered).toContain("@@ function second")
    expect(filtered).not.toContain("@@ function first")
    expect(filtered).toContain("*** Add File: notes.md")
    expect(summarizePatchText(filtered).files[0]!.hunks).toHaveLength(1)
  })

  it("applies every chunk when a file has no hunk entry", () => {
    expect(filterPatchTextByFiles(PATCH, ["app.ts"])).toContain("@@ function first")
  })

  it("drops a file whose chunk selection is empty", () => {
    expect(filterPatchTextByFiles(PATCH, ["app.ts", "notes.md"], { "app.ts": [] })).not.toContain("app.ts")
  })
})

describe("partial approval through the executor", () => {
  let dir: string
  let ctx: ToolContext
  const originalStorageDir = snapshotManager.getStorageDir()

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "aurict-hunks-"))
    snapshotManager.setStorageDir(join(dir, ".aurict", "snapshots"))
    snapshotManager.clear()
    ctx = { sessionId: "hunks", workdir: dir, signal: new AbortController().signal }
    writeFileSync(join(dir, "app.ts"), "function first() {\n  return 1\n}\nfunction second() {\n  return 2\n}\n")
  })

  afterEach(() => {
    PermissionStore.clear()
    PermissionGate.cancelPending()
    snapshotManager.clear()
    snapshotManager.setStorageDir(originalStorageDir)
    rmSync(dir, { recursive: true, force: true })
  })

  it("writes only the approved chunk and records it under the session snapshot scope", async () => {
    const off = ExecutorEvents.on((event) => {
      if (event.type !== "permission_ask") return
      PermissionGate.respond(event.request.id, { decision: "allow_partial", approvedFiles: ["app.ts"], approvedHunks: { "app.ts": [0] } })
    })
    try {
      const patch = [
        "*** Begin Patch",
        "*** Update File: app.ts",
        "@@",
        " function first() {",
        "-  return 1",
        "+  return 10",
        " }",
        "@@",
        " function second() {",
        "-  return 2",
        "+  return 20",
        " }",
        "*** End Patch",
      ].join("\n")
      const result = await executeTool(applyPatchTool, { patchText: patch }, ctx)
      expect(result.error).toBeUndefined()
    } finally {
      off()
    }
    const content = readFileSync(join(dir, "app.ts"), "utf8")
    expect(content).toContain("return 10")
    expect(content).toContain("return 2\n")
    expect(snapshotManager.changedFilesSince(0, sessionSnapshotScope(dir, "hunks"))).toEqual([join(dir, "app.ts")])
  })
})

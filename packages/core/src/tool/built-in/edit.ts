import { z } from "zod"
import { readFile, stat, writeFile } from "fs/promises"
import { resolve, relative } from "path"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"
import { snapshotManager } from "../../snapshot/snapshot.js"
import { resolveWithinWorkspace } from "../../security/path-boundary.js"
import { createUnifiedFileDiff } from "../file-diff.js"

const MAX_EDIT_FILE_BYTES = 5_000_000
const EDIT_IO_TIMEOUT_MS = 10_000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out after ${ms / 1000}s`)), ms)
    promise.then(
      (value) => { clearTimeout(timer); resolve(value) },
      (err) => { clearTimeout(timer); reject(err) },
    )
  })
}

async function takeSnapshotBestEffort(filePath: string, scope: string): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined
  await Promise.race([
    snapshotManager.takeSnapshot(filePath, scope),
    new Promise<void>((resolve) => {
      timer = setTimeout(resolve, 5_000)
    }),
  ])
  if (timer) clearTimeout(timer)
}

export const editTool: ToolDef = {
  id:   "edit",
  spec: { category: "write", riskLevel: "medium", permissionSummary: "Edit a file (string replacement)" },
  timeoutMs: 20_000,
  description: "Replace an exact string in a file. Fails if old_string is not found or is not unique.",
  parameters:  z.object({
    path:       z.string().describe("Path to the file to edit"),
    old_string: z.string().describe("The exact string to replace (must be unique in the file)"),
    new_string: z.string().describe("The replacement string"),
  }),
  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    let filePath: string
    try {
      filePath = await resolveWithinWorkspace(ctx.workdir, String(args["path"] ?? ""))
    } catch (error) {
      return { output: "", error: `Security: ${error instanceof Error ? error.message : String(error)}` }
    }
    const oldString = String(args["old_string"] ?? "")
    const newString = String(args["new_string"] ?? "")

    try {
      const info = await withTimeout(stat(filePath), EDIT_IO_TIMEOUT_MS)
      if (!info.isFile()) {
        return { output: "", error: `Cannot edit non-regular file: ${filePath}` }
      }
      if (info.size > MAX_EDIT_FILE_BYTES) {
        return { output: "", error: `Cannot edit file larger than ${MAX_EDIT_FILE_BYTES} bytes with string replacement: ${filePath}` }
      }
    } catch (err) {
      return { output: "", error: `Cannot stat file before edit: ${err}` }
    }

    await takeSnapshotBestEffort(filePath, `${ctx.workdir}\0${ctx.sessionId}`)

    let content: string
    try {
      content = await withTimeout(readFile(filePath, "utf8"), EDIT_IO_TIMEOUT_MS)
    } catch (err) {
      return { output: "", error: `Cannot read file: ${err}` }
    }


    const count = content.split(oldString).length - 1
    if (count === 0) return { output: "", error: "old_string not found in file. You likely pattern-completed the content from memory instead of reading it. Use the `read` tool to see the actual current content, then retry with an exact verbatim match." }
    if (count > 1)   return { output: "", error: `old_string found ${count} times — must be unique` }

    const updated = content.replace(oldString, newString)
    try {
      await withTimeout(writeFile(filePath, updated, "utf8"), EDIT_IO_TIMEOUT_MS)
      const relPath = relative(ctx.workdir, filePath)
      const unified = createUnifiedFileDiff({ beforePath: relPath, afterPath: relPath, beforeContent: content, afterContent: updated })
      return {
        output: `Updated ${relPath}\n__UNIFIED_DIFF__\n${unified}`,
        metadata: { changedFiles: [relPath], uiArtifact: { rawDiff: unified } },
      }
    } catch (err) {
      return { output: "", error: `Cannot write file: ${err}` }
    }
  },
}

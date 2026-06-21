import { z } from "zod"
import { readFile, stat, writeFile } from "fs/promises"
import { resolve } from "path"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"
import { snapshotManager } from "../../snapshot/snapshot.js"

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

async function takeSnapshotBestEffort(filePath: string): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined
  await Promise.race([
    snapshotManager.takeSnapshot(filePath),
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
    const filePath  = resolve(ctx.workdir, String(args["path"] ?? ""))
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

    await takeSnapshotBestEffort(filePath)

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
      // Diff bilgisini output'a göm — UI bunu parse edip DiffView ile gösterir
      return { output: `Replaced 1 occurrence in ${filePath}\n__DIFF__\n${oldString}\n__NEW__\n${newString}` }
    } catch (err) {
      return { output: "", error: `Cannot write file: ${err}` }
    }
  },
}

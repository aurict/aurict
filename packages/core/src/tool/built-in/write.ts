import { z } from "zod"
import { writeFile, mkdir, readFile, stat } from "fs/promises"
import { resolve, dirname, relative } from "path"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"
import { snapshotManager } from "../../snapshot/snapshot.js"
import { computeDiff } from "../../util/diff.js"
import type { DiffHunk } from "../../util/diff.js"

const MAX_DIFF_BYTES = 500_000
const MAX_PREVIEW_LINES = 50

function hunksToUnifiedDiff(hunks: DiffHunk[], relPath: string): string {
  const out: string[] = [`--- a/${relPath}`, `+++ b/${relPath}`]
  for (const hunk of hunks) {
    const oldCount = hunk.lines.filter(l => l.type !== "add").length
    const newCount = hunk.lines.filter(l => l.type !== "remove").length
    out.push(`@@ -${hunk.oldStart},${oldCount} +${hunk.newStart},${newCount} @@`)
    for (const line of hunk.lines) {
      const s = line.type === "add" ? "+" : line.type === "remove" ? "-" : " "
      out.push(`${s}${line.content}`)
    }
  }
  return out.join("\n")
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

export const writeTool: ToolDef = {
  id:   "write",
  spec: { category: "write", riskLevel: "medium", permissionSummary: "Write/overwrite a file" },
  description: "Write content to a file, creating it or overwriting it completely.",
  parameters:  z.object({
    path:    z.string().describe("Absolute or relative path to the file"),
    content: z.string().describe("Full content to write"),
  }),
  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const filePath = resolve(ctx.workdir, String(args["path"] ?? ""))
    const content  = String(args["content"] ?? "")
    await takeSnapshotBestEffort(filePath)
    // Eski içeriği oku (diff için) — sadece dosya varsa ve küçükse
    let oldContent: string | null = null
    try {
      const info = await stat(filePath)
      if (info.size <= MAX_DIFF_BYTES) {
        oldContent = await readFile(filePath, "utf8")
      }
    } catch { /* dosya yok = yeni dosya */ }

    try {
      await mkdir(dirname(filePath), { recursive: true })
      await writeFile(filePath, content, "utf8")

      const relPath = relative(ctx.workdir, filePath)

      if (oldContent !== null) {
        // Üzerine yazma: diff göster
        const hunks = computeDiff(oldContent, content)
        if (hunks.length > 0) {
          return { output: `Updated ${relPath}\n__UNIFIED_DIFF__\n${hunksToUnifiedDiff(hunks, relPath)}` }
        }
        return { output: `Updated ${relPath} (no changes)` }
      } else {
        // Yeni dosya: içerik önizlemesi
        const allLines  = content.split("\n")
        const lineCount = allLines.length
        const preview   = allLines.slice(0, MAX_PREVIEW_LINES).join("\n")
        return { output: `Created ${relPath}\n__WRITE_CREATE__\n${lineCount}\n${preview}` }
      }
    } catch (err) {
      return { output: "", error: `Cannot write file: ${err}` }
    }
  },
}

import { z } from "zod"
import { writeFile, mkdir, readFile } from "fs/promises"
import { resolve, dirname, relative } from "path"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"
import { snapshotManager } from "../../snapshot/snapshot.js"
import { resolveWithinWorkspace } from "../../security/path-boundary.js"
import { createUnifiedFileDiff } from "../file-diff.js"

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

export const writeTool: ToolDef = {
  id:   "write",
  spec: { category: "write", riskLevel: "medium", permissionSummary: "Write/overwrite a file" },
  description: "Write content to a file, creating it or overwriting it completely.",
  parameters:  z.object({
    path:    z.string().describe("Absolute or relative path to the file"),
    content: z.string().describe("Full content to write"),
  }),
  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    let filePath: string
    try {
      filePath = await resolveWithinWorkspace(ctx.workdir, String(args["path"] ?? ""), { allowMissing: true })
    } catch (error) {
      return { output: "", error: `Security: ${error instanceof Error ? error.message : String(error)}` }
    }
    const content  = String(args["content"] ?? "")
    await takeSnapshotBestEffort(filePath, `${ctx.workdir}\0${ctx.sessionId}`)
    // Eski içeriği oku; kullanıcıya yazılan içeriğin tamamını diff olarak göstereceğiz.
    let oldContent: string | null = null
    try {
      oldContent = await readFile(filePath, "utf8")
    } catch { /* dosya yok = yeni dosya */ }

    try {
      await mkdir(dirname(filePath), { recursive: true })
      await writeFile(filePath, content, "utf8")

      const relPath = relative(ctx.workdir, filePath)

      if (oldContent !== null) {
        const diff = createUnifiedFileDiff({ beforePath: relPath, afterPath: relPath, beforeContent: oldContent, afterContent: content })
        if (diff) return {
          output: `Updated ${relPath}\n__UNIFIED_DIFF__\n${diff}`,
          metadata: { changedFiles: [relPath], uiArtifact: { rawDiff: diff } },
        }
        return { output: `Updated ${relPath} (no changes)` }
      }
      const diff = createUnifiedFileDiff({ afterPath: relPath, beforeContent: "", afterContent: content })
      return {
        output: `Created ${relPath}\n__UNIFIED_DIFF__\n${diff}`,
        metadata: { changedFiles: [relPath], uiArtifact: { rawDiff: diff } },
      }
    } catch (err) {
      return { output: "", error: `Cannot write file: ${err}` }
    }
  },
}

import { z } from "zod"
import { writeFile, mkdir } from "fs/promises"
import { resolve, dirname } from "path"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"
import { snapshotManager } from "../../snapshot/snapshot.js"

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
    try {
      await mkdir(dirname(filePath), { recursive: true })
      await writeFile(filePath, content, "utf8")

      return { output: `Written ${content.length} chars to ${filePath}` }
    } catch (err) {
      return { output: "", error: `Cannot write file: ${err}` }
    }
  },
}

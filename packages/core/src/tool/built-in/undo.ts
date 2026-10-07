import { z } from "zod"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"
import { snapshotManager, sessionSnapshotScope } from "../../snapshot/snapshot.js"

export const undoTool: ToolDef = {
  id:          "undo",
  description: "Undo the last file modification (edit, write, patch).",
  parameters:  z.object({}),
  async execute(_args: Record<string, unknown>, ctx: ToolContext): Promise<ExecuteResult> {
    const restoredPath = await snapshotManager.undoLast(sessionSnapshotScope(ctx.workdir, ctx.sessionId))

    if (restoredPath) {
      return { output: `Success: Restored ${restoredPath}` }
    } else {
      return { output: "", error: "No changes to undo." }
    }
  },
}

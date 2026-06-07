import { z } from "zod"
import { execSync } from "child_process"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

function svn(cmd: string, cwd: string): string {
  try {
    return execSync(`svn ${cmd}`, { cwd, encoding: "utf8", stdio: ["pipe","pipe","pipe"] }).trim()
  } catch (e) {
    const msg = (e as { stderr?: string; message?: string }).stderr || (e as Error).message || String(e)
    throw new Error(msg.trim())
  }
}

export const svnTool: ToolDef = {
  id:          "svn",
  description: `SVN (Subversion) operations — status, diff, log, commit, update.

Actions:
- status:  Show modified/added/deleted files
- diff:    Show local changes (optionally for a specific file/path)
- log:     Recent commit messages (default: last 10)
- commit:  Commit with a message (all local changes)
- update:  Update working copy to latest revision
- info:    Show repository and working copy info

Use status before commit to review what will be submitted.`,

  parameters: z.object({
    action:  z.enum(["status","diff","log","commit","update","info"]),
    file:    z.string().optional().describe("File or path for diff"),
    message: z.string().optional().describe("Commit message"),
    limit:   z.number().optional().describe("Log entry limit (default: 10)"),
  }),

  spec: {
    category:              "execute",
    riskLevel:             "medium",
    requiresConfirmation:  (args) => args["action"] === "commit",
    permissionSummary:     "SVN: commit changes to repository",
  },

  async execute(args: Record<string, unknown>, ctx: ToolContext): Promise<ExecuteResult> {
    const action  = args["action"] as string
    const file    = args["file"]    as string | undefined
    const message = args["message"] as string | undefined
    const limit   = (args["limit"]  as number | undefined) ?? 10

    try {
      switch (action) {
        case "status":  return { output: svn("status", ctx.workdir) || "(no changes)" }
        case "diff":    return { output: svn(`diff${file ? ` "${file}"` : ""}`, ctx.workdir) || "(no diff)" }
        case "log":     return { output: svn(`log --limit ${limit}`, ctx.workdir) }
        case "update":  return { output: svn("update", ctx.workdir) }
        case "info":    return { output: svn("info", ctx.workdir) }
        case "commit":
          if (!message) return { output: "", error: "commit requires a message" }
          return { output: svn(`commit -m "${message.replace(/"/g, '\\"')}"`, ctx.workdir) }
        default:
          return { output: "", error: `Unknown action: ${action}` }
      }
    } catch (e) {
      return { output: "", error: (e as Error).message }
    }
  },
}

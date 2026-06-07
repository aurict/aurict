import { z } from "zod"
import { execSync } from "child_process"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

function p4(cmd: string, cwd: string): string {
  try {
    return execSync(`p4 ${cmd}`, { cwd, encoding: "utf8", stdio: ["pipe","pipe","pipe"] }).trim()
  } catch (e) {
    const msg = (e as { stderr?: string; message?: string }).stderr || (e as Error).message || String(e)
    throw new Error(msg.trim())
  }
}

export const perforceTool: ToolDef = {
  id:          "perforce",
  description: `Perforce (p4) operations — opened, diff, changes, submit, sync.

Actions:
- opened:  List files opened for edit/add/delete in the default changelist
- diff:    Show local changes (optionally for a specific file)
- changes: Show recent submitted changes (default: last 10)
- sync:    Sync workspace to latest revision
- submit:  Submit default changelist with a description
- where:   Show depot path for a local file

Use opened before submit to review pending changes.`,

  parameters: z.object({
    action:      z.enum(["opened","diff","changes","sync","submit","where"]),
    file:        z.string().optional().describe("File path for diff/where"),
    description: z.string().optional().describe("Submit description"),
    limit:       z.number().optional().describe("Changes limit (default: 10)"),
  }),

  spec: {
    category:              "execute",
    riskLevel:             "medium",
    requiresConfirmation:  (args) => args["action"] === "submit",
    permissionSummary:     "Perforce: submit changes to depot",
  },

  async execute(args: Record<string, unknown>, ctx: ToolContext): Promise<ExecuteResult> {
    const action      = args["action"]      as string
    const file        = args["file"]        as string | undefined
    const description = args["description"] as string | undefined
    const limit       = (args["limit"]      as number | undefined) ?? 10

    try {
      switch (action) {
        case "opened":  return { output: p4("opened", ctx.workdir) || "(no open files)" }
        case "diff":    return { output: p4(`diff${file ? ` "${file}"` : ""}`, ctx.workdir) || "(no diff)" }
        case "changes": return { output: p4(`changes -m ${limit} //...`, ctx.workdir) }
        case "sync":    return { output: p4("sync", ctx.workdir) }
        case "where":
          if (!file) return { output: "", error: "where requires a file path" }
          return { output: p4(`where "${file}"`, ctx.workdir) }
        case "submit": {
          if (!description) return { output: "", error: "submit requires a description" }
          // Create a temporary changelist and submit
          const escaped = description.replace(/"/g, '\\"')
          const result  = p4(`submit -d "${escaped}"`, ctx.workdir)
          return { output: result }
        }
        default:
          return { output: "", error: `Unknown action: ${action}` }
      }
    } catch (e) {
      return { output: "", error: (e as Error).message }
    }
  },
}

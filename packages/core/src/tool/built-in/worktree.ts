import { z } from "zod"
import { spawn } from "bun"
import { join } from "path"
import { hooks } from "../../hook/emitter.js"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

const WORKTREE_DIR = ".aurict/worktrees"

async function git(args: string[], cwd: string): Promise<{ out: string; err: string; code: number }> {
  const proc = spawn(["git", ...args], { cwd, stdout: "pipe", stderr: "pipe" })
  const out  = (await new Response(proc.stdout).text()).trim()
  const err  = (await new Response(proc.stderr).text()).trim()
  const code = await proc.exited
  return { out, err, code }
}

export const worktreeTool: ToolDef = {
  id: "worktree",
  description:
    "Manage git worktrees for parallel branch development. " +
    "Actions: list, create (add a new worktree), remove (delete a worktree).",
  parameters: z.object({
    action: z.enum(["list","create","remove"]).describe("Action to perform"),
    branch: z.string().optional().describe("Branch name (required for create/remove)"),
    newBranch: z.boolean().optional().describe("Create a new branch (default false, use existing)"),
    force: z.boolean().optional().describe("Force remove even with uncommitted changes"),
  }),

  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const action    = String(args["action"])
    const branch    = args["branch"]  ? String(args["branch"]) : undefined
    const newBranch = args["newBranch"] === true
    const force     = args["force"]   === true

    // ── list ─────────────────────────────────────────────────────────────────
    if (action === "list") {
      const { out, code } = await git(["worktree", "list", "--porcelain"], ctx.workdir)
      if (code !== 0) return { output: "", error: "Not a git repo or git not found" }

      const entries: string[] = []
      let current = ""
      for (const line of out.split("\n")) {
        if (line.startsWith("worktree ")) current = line.slice(9)
        else if (line.startsWith("branch "))  entries.push(`${current}  [${line.slice(7)}]`)
        else if (line === "") current = ""
      }
      return { output: entries.length ? entries.join("\n") : "(no worktrees)" }
    }

    // ── create ────────────────────────────────────────────────────────────────
    if (action === "create") {
      if (!branch) return { output: "", error: "branch is required for create" }
      const path = join(ctx.workdir, WORKTREE_DIR, branch)
      const gitArgs = newBranch
        ? ["worktree", "add", "-b", branch, path]
        : ["worktree", "add", path, branch]
      const { out, err, code } = await git(gitArgs, ctx.workdir)
      if (code !== 0) return { output: out, error: err || `Failed to create worktree for ${branch}` }
      await hooks.emit("v1.worktree.enter", { branch, path })
      return { output: `Worktree created: ${path}\nBranch: ${branch}\n\nUse /worktree switch to change working directory.` }
    }

    // ── remove ────────────────────────────────────────────────────────────────
    if (action === "remove") {
      if (!branch) return { output: "", error: "branch is required for remove" }
      const path = join(ctx.workdir, WORKTREE_DIR, branch)
      const gitArgs = force
        ? ["worktree", "remove", "--force", path]
        : ["worktree", "remove", path]
      const { out, err, code } = await git(gitArgs, ctx.workdir)
      if (code !== 0) return { output: out, error: err || `Failed to remove worktree for ${branch}` }
      await hooks.emit("v1.worktree.exit", { branch, path, action: force ? "remove" : "keep" } as never)
      return { output: `Worktree removed: ${path}` }
    }

    return { output: "", error: `Unknown action: ${action}` }
  },
}

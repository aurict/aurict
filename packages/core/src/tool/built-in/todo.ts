import { z } from "zod"
import { join } from "path"
import { readFile, writeFile, mkdir } from "fs/promises"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

interface TodoItem {
  id:      string
  text:    string
  done:    boolean
  created: string
}

function todoPath(workdir: string): string {
  return join(workdir, ".aurict", "todos.json")
}

async function load(workdir: string): Promise<TodoItem[]> {
  try { return JSON.parse(await readFile(todoPath(workdir), "utf8")) as TodoItem[] }
  catch { return [] }
}

async function save(workdir: string, items: TodoItem[]): Promise<void> {
  await mkdir(join(workdir, ".aurict"), { recursive: true })
  await writeFile(todoPath(workdir), JSON.stringify(items, null, 2))
}

export const todoTool: ToolDef = {
  id:          "todo",
  description: "Manage a project-local todo list. Actions: list, add, complete, delete.",
  parameters:  z.object({
    action: z.enum(["list", "add", "complete", "delete"]).describe("Action to perform"),
    text:   z.string().optional().describe("Todo text — required for add"),
    id:     z.string().optional().describe("Todo ID prefix (first 6 chars) — required for complete/delete"),
  }),
  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const action = String(args["action"])
    const todos  = await load(ctx.workdir)

    if (action === "list") {
      if (!todos.length) return { output: "(no todos)" }
      return {
        output: todos.map((t) =>
          `[${t.done ? "x" : " "}] ${t.id.slice(0, 6)}  ${t.text}`
        ).join("\n"),
      }
    }

    if (action === "add") {
      const text = String(args["text"] ?? "").trim()
      if (!text) return { output: "", error: "text is required for add" }
      const item: TodoItem = { id: crypto.randomUUID(), text, done: false, created: new Date().toISOString() }
      todos.push(item)
      await save(ctx.workdir, todos)
      return { output: `Added: [${item.id.slice(0, 6)}] ${text}` }
    }

    if (action === "complete" || action === "delete") {
      const prefix = String(args["id"] ?? "").slice(0, 6)
      const idx    = todos.findIndex((t) => t.id.startsWith(prefix))
      if (idx < 0) return { output: "", error: `Todo not found: ${prefix}` }

      if (action === "complete") {
        todos[idx]!.done = true
        await save(ctx.workdir, todos)
        return { output: `Done: ${todos[idx]!.text}` }
      } else {
        const removed = todos.splice(idx, 1)[0]!
        await save(ctx.workdir, todos)
        return { output: `Deleted: ${removed.text}` }
      }
    }

    return { output: "", error: `Unknown action: ${action}` }
  },
}

import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { todoTool } from "../src/tool/built-in/todo.js"
import type { ToolContext } from "../src/tool/types.js"

let tmpDir: string
let ctx: ToolContext

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "aurict-todo-"))
  ctx = {
    sessionId: "test-session",
    workdir:   tmpDir,
    signal:    new AbortController().signal,
    isSubagent: true,
  }
})

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true })
})

// ─── list ─────────────────────────────────────────────────────────────────────

describe("todo list", () => {
  it("empty workdir returns '(no todos)'", async () => {
    const r = await todoTool.execute({ action: "list" }, ctx)
    expect(r.output).toBe("(no todos)")
    expect(r.error).toBeUndefined()
  })

  it("shows added todos", async () => {
    await todoTool.execute({ action: "add", text: "Fix the bug" }, ctx)
    const r = await todoTool.execute({ action: "list" }, ctx)
    expect(r.output).toContain("Fix the bug")
  })

  it("shows checkbox status (unchecked by default)", async () => {
    await todoTool.execute({ action: "add", text: "New task" }, ctx)
    const r = await todoTool.execute({ action: "list" }, ctx)
    expect(r.output).toContain("[ ]")
  })

  it("shows completed item as checked", async () => {
    await todoTool.execute({ action: "add", text: "Done task" }, ctx)
    const list1 = await todoTool.execute({ action: "list" }, ctx)
    const id = list1.output.match(/\]\s+([a-f0-9]{6})/)?.[1]
    expect(id).toBeTruthy()
    await todoTool.execute({ action: "complete", id }, ctx)
    const list2 = await todoTool.execute({ action: "list" }, ctx)
    expect(list2.output).toContain("[x]")
  })
})

// ─── add ─────────────────────────────────────────────────────────────────────

describe("todo add", () => {
  it("returns success message with ID and text", async () => {
    const r = await todoTool.execute({ action: "add", text: "Write tests" }, ctx)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain("Added:")
    expect(r.output).toContain("Write tests")
  })

  it("output contains 6-char ID prefix", async () => {
    const r = await todoTool.execute({ action: "add", text: "task" }, ctx)
    expect(r.output).toMatch(/\[[a-f0-9]{6}\]/)
  })

  it("missing text returns error", async () => {
    const r = await todoTool.execute({ action: "add" }, ctx)
    expect(r.error).toBeTruthy()
    expect(r.error).toContain("text is required")
  })

  it("empty text returns error", async () => {
    const r = await todoTool.execute({ action: "add", text: "" }, ctx)
    expect(r.error).toBeTruthy()
  })

  it("persists to disk", async () => {
    await todoTool.execute({ action: "add", text: "Persisted task" }, ctx)
    const filePath = join(tmpDir, ".aurict", "todos.json")
    expect(existsSync(filePath)).toBe(true)
    const data = JSON.parse(readFileSync(filePath, "utf8"))
    expect(data).toHaveLength(1)
    expect(data[0].text).toBe("Persisted task")
  })

  it("multiple adds grow the list", async () => {
    await todoTool.execute({ action: "add", text: "Task 1" }, ctx)
    await todoTool.execute({ action: "add", text: "Task 2" }, ctx)
    await todoTool.execute({ action: "add", text: "Task 3" }, ctx)
    const r = await todoTool.execute({ action: "list" }, ctx)
    expect(r.output.split("\n")).toHaveLength(3)
  })
})

// ─── complete ────────────────────────────────────────────────────────────────

describe("todo complete", () => {
  it("marks a todo as done by ID prefix", async () => {
    await todoTool.execute({ action: "add", text: "To complete" }, ctx)
    const list = await todoTool.execute({ action: "list" }, ctx)
    const id = list.output.match(/\]\s+([a-f0-9]{6})/)?.[1]!
    const r = await todoTool.execute({ action: "complete", id }, ctx)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain("Done:")
    expect(r.output).toContain("To complete")
  })

  it("returns error for unknown ID prefix", async () => {
    const r = await todoTool.execute({ action: "complete", id: "000000" }, ctx)
    expect(r.error).toBeTruthy()
    expect(r.error).toContain("not found")
  })

  it("persists done status to disk", async () => {
    await todoTool.execute({ action: "add", text: "Finish me" }, ctx)
    const list = await todoTool.execute({ action: "list" }, ctx)
    const id = list.output.match(/\]\s+([a-f0-9]{6})/)?.[1]!
    await todoTool.execute({ action: "complete", id }, ctx)
    const data = JSON.parse(readFileSync(join(tmpDir, ".aurict", "todos.json"), "utf8"))
    expect(data[0].done).toBe(true)
  })
})

// ─── delete ──────────────────────────────────────────────────────────────────

describe("todo delete", () => {
  it("removes a todo by ID prefix", async () => {
    await todoTool.execute({ action: "add", text: "To delete" }, ctx)
    const list = await todoTool.execute({ action: "list" }, ctx)
    const id = list.output.match(/\]\s+([a-f0-9]{6})/)?.[1]!
    const r = await todoTool.execute({ action: "delete", id }, ctx)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain("Deleted:")
    const list2 = await todoTool.execute({ action: "list" }, ctx)
    expect(list2.output).toBe("(no todos)")
  })

  it("returns error for unknown ID prefix", async () => {
    const r = await todoTool.execute({ action: "delete", id: "ffffff" }, ctx)
    expect(r.error).toBeTruthy()
  })

  it("deletes only the targeted item, others remain", async () => {
    await todoTool.execute({ action: "add", text: "Keep me" }, ctx)
    await todoTool.execute({ action: "add", text: "Delete me" }, ctx)
    const list = await todoTool.execute({ action: "list" }, ctx)
    // Find the ID of "Delete me" (second item)
    const lines = list.output.split("\n")
    const targetLine = lines.find((l) => l.includes("Delete me"))!
    const id = targetLine.match(/\]\s+([a-f0-9]{6})/)?.[1]!
    await todoTool.execute({ action: "delete", id }, ctx)
    const list2 = await todoTool.execute({ action: "list" }, ctx)
    expect(list2.output).toContain("Keep me")
    expect(list2.output).not.toContain("Delete me")
  })
})

// ─── persistence across context instances ────────────────────────────────────

describe("todo persistence", () => {
  it("todos survive a new ToolContext with same workdir", async () => {
    await todoTool.execute({ action: "add", text: "Survived task" }, ctx)
    // New ctx, same workdir (simulates session restart)
    const ctx2: ToolContext = {
      sessionId: "new-session",
      workdir:   tmpDir,
      signal:    new AbortController().signal,
    }
    const r = await todoTool.execute({ action: "list" }, ctx2)
    expect(r.output).toContain("Survived task")
  })

  it("different workdirs have independent todo lists", async () => {
    const otherDir = mkdtempSync(join(tmpdir(), "aurict-todo-other-"))
    try {
      const ctx2: ToolContext = {
        sessionId: "other-session",
        workdir:   otherDir,
        signal:    new AbortController().signal,
      }
      await todoTool.execute({ action: "add", text: "Project A task" }, ctx)
      await todoTool.execute({ action: "add", text: "Project B task" }, ctx2)
      const r1 = await todoTool.execute({ action: "list" }, ctx)
      const r2 = await todoTool.execute({ action: "list" }, ctx2)
      expect(r1.output).toContain("Project A task")
      expect(r1.output).not.toContain("Project B task")
      expect(r2.output).toContain("Project B task")
      expect(r2.output).not.toContain("Project A task")
    } finally {
      rmSync(otherDir, { recursive: true, force: true })
    }
  })
})

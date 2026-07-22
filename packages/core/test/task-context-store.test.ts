import { afterEach, describe, expect, it } from "bun:test"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { buildTaskLedger } from "../src/agent/task-ledger.js"
import { buildTaskContext } from "../src/context/builder.js"
import { formatTaskContext } from "../src/context/format.js"
import { taskManager } from "../src/task/manager.js"

const directories: string[] = []

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

describe("canonical task store", () => {
  it("persists isolated session tasks atomically and preserves dependency identity", () => {
    const workdir = mkdtempSync(join(tmpdir(), "aurict-task-store-"))
    directories.push(workdir)
    const first = { workdir, sessionId: "session-a" }
    const second = { workdir, sessionId: "session-b" }

    taskManager.replaceTasks([], first)
    taskManager.createTask("inspect", "Inspect the runtime", [], first)
    taskManager.createTask("implement", "Implement the shared kernel", ["inspect"], first)
    expect(taskManager.getTask("implement", first)?.status).toBe("pending")
    taskManager.completeTask("inspect", "runtime mapped", first)
    expect(taskManager.getTask("implement", first)?.status).toBe("ready")
    expect(taskManager.getTask("implement", first)?.dependencies).toEqual(["inspect"])
    expect(taskManager.getTasks(second)).toEqual([])

    const statePath = join(workdir, ".aurict", "session-state", "session-a.tasks.json")
    expect(existsSync(statePath)).toBe(true)
    const stored = JSON.parse(readFileSync(statePath, "utf8"))
    expect(stored.version).toBe(1)
    expect(stored.events.map((event: { type: string }) => event.type)).toEqual(["created", "created", "completed"])
  })

  it("feeds stable ids and subjects into the task ledger", () => {
    const ledger = buildTaskLedger({
      objective: "Build runtime",
      workingSet: { updatedAt: 1, items: [] },
      tasks: [{ id: "runtime", subject: "Create shared runtime", status: "in_progress" }],
    })
    expect(ledger.openSteps).toEqual([{ id: "runtime", label: "Create shared runtime", status: "in_progress" }])
  })
})

describe("structured task context", () => {
  it("preserves authoritative task state and observed files across rebuilds", () => {
    const first = buildTaskContext({
      objective: "Unify the agent runtime",
      tasks: [{ id: "runtime", subject: "Shared runtime", status: "in_progress", blockedBy: [] }],
      workingSet: {
        updatedAt: 1,
        items: [{
          id: "file:runtime",
          kind: "file",
          label: "runtime.ts",
          path: "src/runtime.ts",
          score: 10,
          lastSeenAt: 1,
          source: "edit",
          reason: "changed file",
        }],
      },
      now: 10,
    })
    const resumed = buildTaskContext({
      objective: first.objective,
      tasks: first.tasks,
      workingSet: { updatedAt: 2, items: [] },
      previous: first,
      verification: { status: "passed", source: "tool_metadata", summary: "tests passed" },
      now: 20,
    })
    expect(resumed.relevantFiles).toEqual([{ path: "src/runtime.ts", reason: "changed file", status: "changed" }])
    expect(resumed.evidenceRefs).toContain("verification:passed")
    expect(formatTaskContext(resumed)).toContain("runtime:Shared runtime [in_progress]")
  })
})

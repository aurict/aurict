import { describe, it, expect } from "bun:test"
import { mkdtemp } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { DAGOrchestrator } from "../src/agent/dag-orchestrator.js"
import type { DAGNode } from "../src/agent/dag-orchestrator.js"

describe("DAGOrchestrator", () => {
  it("detects cycle and throws error", () => {
    const nodes: DAGNode[] = [
      {
        id: "task-1",
        agentType: "code",
        desc: "Task 1",
        prompt: "First task",
        dependencies: ["task-2"],
        status: "pending",
      },
      {
        id: "task-2",
        agentType: "review",
        desc: "Task 2",
        prompt: "Second task",
        dependencies: ["task-1"],
        status: "pending",
      },
    ]

    expect(() => new DAGOrchestrator(nodes)).toThrow("Cycle detected")
  })

  it("succeeds for valid acyclic graphs", () => {
    const nodes: DAGNode[] = [
      {
        id: "task-1",
        agentType: "code",
        desc: "Task 1",
        prompt: "First task",
        dependencies: [],
        status: "pending",
      },
      {
        id: "task-2",
        agentType: "review",
        desc: "Task 2",
        prompt: "Second task",
        dependencies: ["task-1"],
        status: "pending",
      },
    ]

    expect(() => new DAGOrchestrator(nodes)).not.toThrow()
  })

  it("resolves dependencies in correct order", async () => {
    const nodes: DAGNode[] = [
      {
        id: "task-1",
        agentType: "explore",
        desc: "Task 1",
        prompt: "Explore codebase",
        dependencies: [],
        status: "pending",
      },
      {
        id: "task-2",
        agentType: "code",
        desc: "Task 2",
        prompt: "Write code based on exploration",
        dependencies: ["task-1"],
        status: "pending",
      },
      {
        id: "task-3",
        agentType: "security",
        desc: "Task 3",
        prompt: "Scan code for vulnerabilities",
        dependencies: ["task-1"],
        status: "pending",
      },
      {
        id: "task-4",
        agentType: "review",
        desc: "Task 4",
        prompt: "Review code and scan results",
        dependencies: ["task-2", "task-3"],
        status: "pending",
      },
    ]

    const executionOrder: string[] = []

    const orchestrator = new DAGOrchestrator(nodes, async (opts: any) => {
      executionOrder.push(opts.id)
      return `Result of ${opts.id}`
    })
    const workdir = await mkdtemp(join(tmpdir(), "aurict-dag-"))
    const result = await orchestrator.run({
      parentSessionId: "parent-1",
      provider: "mock",
      model: "mock-model",
      workdir,
    })

    expect(result.outputs["task-1"]).toBe("Result of task-1")
    expect(result.outputs["task-2"]).toBe("Result of task-2")
    expect(result.outputs["task-3"]).toBe("Result of task-3")
    expect(result.outputs["task-4"]).toBe("Result of task-4")

    // task-1 must execute first
    expect(executionOrder[0]).toBe("task-1")
    // task-4 must execute last
    expect(executionOrder[3]).toBe("task-4")
    // task-2 and task-3 must execute in the middle (order doesn't matter as long as they are index 1 & 2)
    const middleTasks = executionOrder.slice(1, 3)
    expect(middleTasks).toContain("task-2")
    expect(middleTasks).toContain("task-3")
  })

  it("continues independent branches and blocks only failed descendants", async () => {
    const nodes: DAGNode[] = [
      { id: "bad", agentType: "code", desc: "bad", prompt: "bad", dependencies: [], maxAttempts: 1, status: "pending" },
      { id: "blocked", agentType: "test", desc: "blocked", prompt: "blocked", dependencies: ["bad"], status: "pending" },
      { id: "independent", agentType: "review", desc: "independent", prompt: "independent", dependencies: [], status: "pending" },
    ]
    const workdir = await mkdtemp(join(tmpdir(), "aurict-dag-"))
    const orchestrator = new DAGOrchestrator(nodes, async (opts: any) => {
      if (opts.id === "bad") throw new Error("boom")
      return "independent result"
    })
    const result = await orchestrator.run({ parentSessionId: crypto.randomUUID(), provider: "mock", model: "mock", workdir })
    expect(result.statuses["bad"]).toBe("failed")
    expect(result.statuses["blocked"]).toBe("blocked")
    expect(result.statuses["independent"]).toBe("completed")
  })

  it("retries a node and serializes overlapping file scopes", async () => {
    let firstAttempts = 0
    let active = 0
    let maxActive = 0
    const nodes: DAGNode[] = [
      { id: "first", agentType: "code", desc: "first", prompt: "first", dependencies: [], fileScopes: ["src/a.ts"], maxAttempts: 2, status: "pending" },
      { id: "second", agentType: "code", desc: "second", prompt: "second", dependencies: [], fileScopes: ["src"], status: "pending" },
    ]
    const workdir = await mkdtemp(join(tmpdir(), "aurict-dag-"))
    const orchestrator = new DAGOrchestrator(nodes, async (opts: any) => {
      active++
      maxActive = Math.max(maxActive, active)
      try {
        if (opts.id === "first" && ++firstAttempts === 1) throw new Error("transient")
        return opts.id
      } finally {
        active--
      }
    })
    const result = await orchestrator.run({ parentSessionId: crypto.randomUUID(), provider: "mock", model: "mock", workdir })
    expect(result.statuses["first"]).toBe("completed")
    expect(firstAttempts).toBe(2)
    expect(maxActive).toBe(1)
  })
})

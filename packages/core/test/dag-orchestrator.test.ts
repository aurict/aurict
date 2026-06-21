import { describe, it, expect, mock, beforeAll } from "bun:test"
import { DAGOrchestrator } from "../src/agent/dag-orchestrator.js"
import type { DAGNode } from "../src/agent/dag-orchestrator.js"
import { agentPool } from "../src/agent/pool.js"

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

    // Mock agentPool.spawn to track execution order and return dummy outputs
    mock.module("../src/agent/pool.js", () => {
      return {
        agentPool: {
          spawn: async (opts: any) => {
            executionOrder.push(opts.id)
            return `Result of ${opts.id}`
          }
        }
      }
    })

    const orchestrator = new DAGOrchestrator(nodes)
    const result = await orchestrator.run({
      parentSessionId: "parent-1",
      provider: "mock",
      model: "mock-model",
      workdir: "/tmp",
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
})

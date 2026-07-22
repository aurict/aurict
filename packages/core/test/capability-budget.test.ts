import { describe, expect, it } from "bun:test"
import { selectTools } from "../src/tool/capability-router.js"
import { BudgetExceededError, RunBudgetManager } from "../src/runtime/budget-manager.js"
import { ToolRegistry } from "../src/tool/registry.js"
import type { TaskContext } from "../src/context/types.js"

describe("capability tool routing", () => {
  const available = [
    "read", "grep", "edit", "bash", "verify", "websearch", "git",
    "security_scan", "finance_calculate", "document_extract", "mcp_acme_query",
  ]

  it("keeps the core surface and activates intent packs without exceeding the limit", () => {
    const selection = selectTools({
      text: "Find and fix the security vulnerability, then run tests",
      availableToolIds: available,
      maxVisible: 8,
    })
    expect(selection.capabilities).toContain("security")
    expect(selection.capabilities).toContain("change")
    expect(selection.capabilities).toContain("verify")
    expect(selection.selectedToolIds).toContain("security_scan")
    expect(selection.selectedToolIds.length).toBeLessThanOrEqual(8)
  })

  it("never expands beyond an explicit allowlist", () => {
    const selection = selectTools({
      text: "scan security and edit files",
      availableToolIds: available,
      allowedToolIds: ["read", "security_scan"],
    })
    expect(selection.selectedToolIds).toEqual(["read", "security_scan"])
  })

  it("keeps objective intent and explicit capability requests across continuation turns", () => {
    const selection = selectTools({
      text: "continue",
      objective: "Audit the security boundary and produce a PDF report",
      requestedCapabilities: ["research"],
      availableToolIds: available,
      maxVisible: 20,
    })
    expect(selection.capabilities).toEqual(expect.arrayContaining(["security", "document", "research"]))
    expect(selection.selectedToolIds).toEqual(expect.arrayContaining(["security_scan", "document_extract", "websearch"]))
  })

  it("request_tools records a durable capability request in task context", async () => {
    const taskContext: TaskContext = {
      version: 1 as const, objective: "Research docs", constraints: [], decisions: [], workspaceFacts: [],
      relevantFiles: [], failedStrategies: [], openQuestions: [], tasks: [], evidenceRefs: [], updatedAt: 1,
    }
    const result = await ToolRegistry.get("request_tools")!.execute(
      { capabilities: ["research"], reason: "Need current docs" },
      { sessionId: "session", workdir: process.cwd(), signal: new AbortController().signal, taskContext },
    )
    expect(result.error).toBeUndefined()
    expect(taskContext.requestedCapabilities).toEqual(["research"])
  })
})

describe("run budgets", () => {
  it("fails loudly at the first exceeded hard limit", () => {
    const budget = new RunBudgetManager({ toolCalls: 1 })
    budget.recordToolCall()
    expect(() => budget.recordToolCall()).toThrow(BudgetExceededError)
    expect(budget.snapshot().usage.toolCalls).toBe(2)
  })

  it("counts mutations from typed effects", () => {
    const budget = new RunBudgetManager({ mutationCalls: 0 })
    expect(() => budget.recordToolOutcome({
      status: "succeeded",
      summary: "changed",
      display: "changed",
      modelContent: "changed",
      effects: [{ kind: "workspace_write", paths: ["a.ts"] }],
      artifacts: [],
      verification: [],
      retry: { safety: "reconcilable", effectCommitted: true },
      metrics: { durationMs: 1, outputBytes: 7 },
      source: "native",
    })).toThrow("mutationCalls")
  })
})

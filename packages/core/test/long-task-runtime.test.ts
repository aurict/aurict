import { describe, expect, it } from "bun:test"
import { evaluateLongTaskContinuation } from "../src/agent/continuation-controller.js"
import { buildTaskLedger, formatTaskLedgerAnchor } from "../src/agent/task-ledger.js"
import { isTaskContinuationTurn } from "../src/agent/turn-intent.js"
import type { CompletionGateDecision } from "../src/agent/completion-gate.js"
import type { ContinuationDecision } from "../src/agent/continuation.js"
import type { WorkingSetSnapshot } from "../src/agent/working-set.js"
import { resolveLongTaskRuntimeConfig } from "../src/config/config.js"

const completeContinuation: ContinuationDecision = {
  shouldContinue: false,
  stopReason: "complete",
  previousContinuations: 0,
  maxContinuations: 5,
  nextContinuationCount: 0,
  tasksOpen: false,
}

const completeGate: CompletionGateDecision = {
  status: "complete",
  shouldAutoContinue: false,
  reason: "complete",
  shadowOnly: false,
}

describe("long task runtime", () => {
  it("builds a verifying ledger when changed files lack verification", () => {
    const ledger = buildTaskLedger({
      objective: "fix tests",
      workingSet: workingSetWithChangedFile(),
      continuation: completeContinuation,
    })

    expect(ledger.phase).toBe("verifying")
    expect(ledger.changedFiles).toEqual(["src/a.ts"])
    expect(formatTaskLedgerAnchor(ledger)).toContain("Phase: verifying")
  })

  it("continues when verification is pending", () => {
    const ledger = buildTaskLedger({
      objective: "fix tests",
      workingSet: workingSetWithChangedFile(),
      continuation: completeContinuation,
    })
    const decision = evaluateLongTaskContinuation({
      text: "Done.",
      ledger,
      completionGate: completeGate,
      continuation: completeContinuation,
      config: resolveLongTaskRuntimeConfig({ longTaskRuntime: { mode: "soft" } }),
      budget: { previousContinuations: 0 },
    })

    expect(decision.shouldContinue).toBe(true)
    expect(decision.reason).toBe("verification_pending")
    expect(decision.nudge).toContain("passing verification is missing")
  })

  it("does not continue in shadow mode but reports the reason", () => {
    const ledger = buildTaskLedger({
      objective: "fix tests",
      workingSet: workingSetWithChangedFile(),
      continuation: completeContinuation,
    })
    const decision = evaluateLongTaskContinuation({
      text: "Done.",
      ledger,
      completionGate: completeGate,
      continuation: completeContinuation,
      config: resolveLongTaskRuntimeConfig({ longTaskRuntime: { mode: "shadow" } }),
      budget: { previousContinuations: 0 },
    })

    expect(decision.shouldContinue).toBe(false)
    expect(decision.shadowOnly).toBe(true)
    expect(decision.reason).toBe("verification_pending")
  })

  it("stops when continuation budget is exhausted", () => {
    const ledger = buildTaskLedger({
      objective: "fix tests",
      workingSet: workingSetWithChangedFile(),
      continuation: completeContinuation,
    })
    const decision = evaluateLongTaskContinuation({
      text: "Done.",
      ledger,
      completionGate: completeGate,
      continuation: completeContinuation,
      config: resolveLongTaskRuntimeConfig({ longTaskRuntime: { maxContinuationSteps: 1 } }),
      budget: { previousContinuations: 1 },
    })

    expect(decision.shouldContinue).toBe(false)
    expect(decision.reason).toBe("budget_exhausted")
  })

  it("moves to recovering when verification failed", () => {
    const ledger = buildTaskLedger({
      objective: "fix tests",
      workingSet: {
        updatedAt: Date.now(),
        items: [{
          id: "verification:1",
          kind: "verification",
          label: "error TS2322",
          score: 99,
          lastSeenAt: Date.now(),
          source: "bash",
          reason: "verification signal",
          status: "failed",
        }],
      },
      continuation: completeContinuation,
    })

    expect(ledger.phase).toBe("recovering")
  })

  it("continues on future-tense final text", () => {
    const ledger = buildTaskLedger({
      objective: "fix tests",
      workingSet: { updatedAt: Date.now(), items: [] },
      continuation: completeContinuation,
    })
    const decision = evaluateLongTaskContinuation({
      text: "I will now run the tests.",
      ledger,
      completionGate: completeGate,
      continuation: completeContinuation,
      config: resolveLongTaskRuntimeConfig({}),
      budget: { previousContinuations: 0 },
    })

    expect(decision.shouldContinue).toBe(true)
    expect(decision.reason).toBe("future_tense")
  })

  it("does not continue stale work on casual chat turns", () => {
    const ledger = buildTaskLedger({
      objective: "naber",
      workingSet: workingSetWithChangedFile(),
      continuation: completeContinuation,
    })
    const decision = evaluateLongTaskContinuation({
      text: "İyiyim, sen nasılsın?",
      ledger,
      completionGate: {
        status: "verification_required",
        shouldAutoContinue: false,
        reason: "changed files outside task turn",
        shadowOnly: true,
      },
      continuation: completeContinuation,
      config: resolveLongTaskRuntimeConfig({ longTaskRuntime: { mode: "soft" } }),
      budget: { previousContinuations: 0 },
      taskIntent: isTaskContinuationTurn("naber"),
    })

    expect(decision.shouldContinue).toBe(false)
    expect(decision.reason).toBe("not_task_turn")
  })

  it("classifies explicit work turns separately from casual turns", () => {
    expect(isTaskContinuationTurn("naber")).toBe(false)
    expect(isTaskContinuationTurn("şuan sisteme kaç verirsin")).toBe(false)
    expect(isTaskContinuationTurn("devam et ve testleri çalıştır")).toBe(true)
    expect(isTaskContinuationTurn("version bump yap")).toBe(true)
  })
})

function workingSetWithChangedFile(): WorkingSetSnapshot {
  return {
    updatedAt: Date.now(),
    items: [{
      id: "file:src/a.ts",
      kind: "file",
      label: "src/a.ts",
      path: "src/a.ts",
      score: 95,
      lastSeenAt: Date.now(),
      source: "write",
      reason: "changed file",
      status: "active",
    }],
  }
}

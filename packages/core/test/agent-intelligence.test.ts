import { afterEach, describe, expect, it } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { buildAttentionAnchor } from "../src/agent/attention-anchor.js"
import { evaluateCompletionGate } from "../src/agent/completion-gate.js"
import { clearFailureCooldown, getFailureCooldownSnapshot, recordFailureCooldown } from "../src/agent/failure-cooldown.js"
import { recordRunTrace, readLatestTraceEvents } from "../src/agent/run-trace.js"
import { clearWorkingSet, getWorkingSetSnapshot, updateWorkingSetFromTool } from "../src/agent/working-set.js"
import { distillToolResult } from "../src/tool/result-distiller.js"

let dirs: string[] = []

afterEach(async () => {
  clearWorkingSet()
  clearFailureCooldown()
  await Promise.all(dirs.map(dir => rm(dir, { recursive: true, force: true })))
  dirs = []
})

describe("agent intelligence primitives", () => {
  it("distills tool results without dropping key verification and file signals", () => {
    const distilled = distillToolResult("write", { path: "src/a.ts" }, {
      output: "Wrote src/a.ts\n[TypeScript] ✓ No errors",
      metadata: { changedFiles: ["src/a.ts"] },
    })

    expect(distilled.changedFiles).toContain("src/a.ts")
    expect(distilled.verification.some(line => line.includes("TypeScript"))).toBe(true)
    expect(distilled.nextImplication).toContain("Verification")
  })

  it("updates working set from distilled tool results", () => {
    const distilled = distillToolResult("write", { path: "src/a.ts" }, {
      output: "Wrote src/a.ts",
      metadata: { changedFiles: ["src/a.ts"] },
    })
    updateWorkingSetFromTool("s1", process.cwd(), distilled)

    const snapshot = getWorkingSetSnapshot("s1")
    expect(snapshot.items.some(item => item.kind === "file" && item.label === "src/a.ts")).toBe(true)
  })

  it("builds a bounded attention anchor from working set and verification state", () => {
    const anchor = buildAttentionAnchor({
      objective: "Fix the broken tests and verify them",
      workingSet: {
        updatedAt: Date.now(),
        items: [{
          id: "file:src/a.ts",
          kind: "file",
          label: "src/a.ts",
          score: 90,
          lastSeenAt: Date.now(),
          source: "write",
          reason: "changed file",
          status: "active",
        }],
      },
      verification: { status: "passed", source: "text", summary: "bun test passed with 0 fail" },
      maxChars: 1_200,
    })

    expect(anchor).toContain("Attention Anchor")
    expect(anchor).toContain("src/a.ts")
    expect(anchor.length).toBeLessThanOrEqual(1_200)
  })

  it("completion gate requires verification when changed files have no passing verification", () => {
    const decision = evaluateCompletionGate({
      text: "Done",
      continuation: {
        shouldContinue: false,
        stopReason: "complete",
        previousContinuations: 0,
        maxContinuations: 5,
        nextContinuationCount: 0,
        tasksOpen: false,
      },
      workingSet: {
        updatedAt: Date.now(),
        items: [{
          id: "file:src/a.ts",
          kind: "file",
          label: "src/a.ts",
          score: 95,
          lastSeenAt: Date.now(),
          source: "write",
          reason: "changed file",
          status: "active",
        }],
      },
    })

    expect(decision.status).toBe("verification_required")
    expect(decision.shouldAutoContinue).toBe(true)
  })

  it("completion gate does not auto-continue stale verification on casual turns", () => {
    const decision = evaluateCompletionGate({
      text: "İyiyim, sen nasılsın?",
      continuation: {
        shouldContinue: false,
        stopReason: "complete",
        previousContinuations: 0,
        maxContinuations: 5,
        nextContinuationCount: 0,
        tasksOpen: false,
      },
      workingSet: {
        updatedAt: Date.now(),
        items: [{
          id: "file:src/a.ts",
          kind: "file",
          label: "src/a.ts",
          score: 95,
          lastSeenAt: Date.now(),
          source: "write",
          reason: "changed file",
          status: "active",
        }],
      },
      allowTaskAutoContinue: false,
    })

    expect(decision.status).toBe("verification_required")
    expect(decision.shouldAutoContinue).toBe(false)
    expect(decision.shadowOnly).toBe(true)
  })

  it("marks repeated failures as strategy shift required", () => {
    const distilled = distillToolResult("bash", { command: "bun test" }, {
      output: "",
      error: "error TS2322: Type mismatch",
    })

    recordFailureCooldown("s1", "bash", { command: "bun test" }, distilled)
    recordFailureCooldown("s1", "bash", { command: "bun test" }, distilled)
    const third = recordFailureCooldown("s1", "bash", { command: "bun test" }, distilled)

    expect(third?.strategyShiftRequired).toBe(true)
    expect(getFailureCooldownSnapshot("s1").active.length).toBe(1)
  })

  it("records and reads trace events", async () => {
    const workdir = await mkdtemp(join(tmpdir(), "aurict-trace-"))
    dirs.push(workdir)

    await recordRunTrace(workdir, "s1", "completion_gate", { status: "complete" })
    const events = await readLatestTraceEvents(workdir, "s1")

    expect(events[0]?.type).toBe("completion_gate")
    expect(events[0]?.data["status"]).toBe("complete")
  })
})

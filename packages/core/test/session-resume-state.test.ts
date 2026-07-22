import { afterEach, describe, expect, it } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  extractVerificationSnapshot,
  extractWorkingSetVerificationSnapshot,
  readSessionResumeState,
  writeSessionResumeState,
} from "../src/session/resume-state.js"

let dirs: string[] = []

afterEach(async () => {
  await Promise.all(dirs.map(dir => rm(dir, { recursive: true, force: true })))
  dirs = []
})

describe("session resume state", () => {
  it("persists active skill stack and continuation state", async () => {
    const workdir = await mkdtemp(join(tmpdir(), "aurict-resume-"))
    dirs.push(workdir)

    await writeSessionResumeState({
      sessionId: "s1",
      workdir,
      provider: "anthropic",
      model: "test-model",
      updatedAt: 123,
      activeSkills: [{
        skillId: "report",
        skillName: "Report",
        allowedTools: ["read"],
        executionContext: "inline",
      }],
      continuation: {
        shouldContinue: true,
        reason: "open_tasks",
        previousContinuations: 1,
        maxContinuations: 15,
        nextContinuationCount: 2,
        tasksOpen: true,
      },
      taskLedger: {
        objective: "finish implementation",
        phase: "verifying",
        openSteps: [],
        changedFiles: ["src/a.ts"],
        verification: { status: "none" },
        recoveryAttempts: [],
        blockers: [],
        lastProgressAt: 123,
      },
      taskContext: {
        version: 1,
        objective: "finish implementation",
        constraints: [],
        decisions: [],
        workspaceFacts: [],
        relevantFiles: [{ path: "src/a.ts", reason: "changed file", status: "changed" }],
        failedStrategies: [],
        openQuestions: [],
        tasks: [{ id: "implement", subject: "Implement runtime", status: "in_progress", blockedBy: [] }],
        evidenceRefs: [],
        updatedAt: 123,
      },
      activeToolIds: ["read", "grep", "edit"],
    })

    const state = await readSessionResumeState(workdir, "s1")

    expect(state?.activeSkills[0]?.skillId).toBe("report")
    expect(state?.continuation?.nextContinuationCount).toBe(2)
    expect(state?.taskLedger?.phase).toBe("verifying")
    expect(state?.taskLedger?.changedFiles).toEqual(["src/a.ts"])
    expect(state?.taskContext?.tasks[0]?.subject).toBe("Implement runtime")
    expect(state?.activeToolIds).toEqual(["read", "grep", "edit"])
  })

  it("extracts verification status from final text", () => {
    expect(extractVerificationSnapshot("[TypeScript] ✓ No errors")?.status).toBe("passed")
    expect(extractVerificationSnapshot("[TypeScript] Errors in this file after edit:\nsrc/a.ts(1,1): error TS2322")?.status).toBe("failed")
    expect(extractVerificationSnapshot("[TypeScript] Skipped (post-edit check timed out)")?.status).toBe("timeout")
  })

  it("prefers structured tool verification evidence", () => {
    const snapshot = extractWorkingSetVerificationSnapshot({
      updatedAt: 20,
      items: [{
        id: "verification:1",
        kind: "verification",
        label: "12 tests passed, 0 failed",
        score: 90,
        lastSeenAt: 20,
        source: "verify",
        reason: "verification signal",
        status: "passed",
      }],
    })
    expect(snapshot).toEqual({
      status: "passed",
      source: "tool_metadata",
      summary: "verify: 12 tests passed, 0 failed",
    })
  })

  it("does not promote arbitrary shell output into structured verification", () => {
    expect(extractWorkingSetVerificationSnapshot({
      updatedAt: 20,
      items: [{
        id: "verification:echo",
        kind: "verification",
        label: "tests passed, 0 failed",
        score: 90,
        lastSeenAt: 20,
        source: "bash",
        reason: "verification signal",
        status: "passed",
      }],
    })).toBeUndefined()
  })
})

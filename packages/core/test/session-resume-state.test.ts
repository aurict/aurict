import { afterEach, describe, expect, it } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  extractVerificationSnapshot,
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
    })

    const state = await readSessionResumeState(workdir, "s1")

    expect(state?.activeSkills[0]?.skillId).toBe("report")
    expect(state?.continuation?.nextContinuationCount).toBe(2)
  })

  it("extracts verification status from final text", () => {
    expect(extractVerificationSnapshot("[TypeScript] ✓ No errors")?.status).toBe("passed")
    expect(extractVerificationSnapshot("[TypeScript] Errors in this file after edit:\nsrc/a.ts(1,1): error TS2322")?.status).toBe("failed")
    expect(extractVerificationSnapshot("[TypeScript] Skipped (post-edit check timed out)")?.status).toBe("timeout")
  })
})

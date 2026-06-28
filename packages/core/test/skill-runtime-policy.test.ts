import { afterEach, describe, expect, it } from "bun:test"
import { z } from "zod"
import { executeTool } from "../src/tool/executor.js"
import type { ToolContext, ToolDef } from "../src/tool/types.js"
import {
  clearActiveSkillPolicy,
  isToolAllowedByActiveSkillPolicy,
  setActiveSkillPolicy,
} from "../src/skill/runtime-policy.js"

afterEach(() => {
  clearActiveSkillPolicy()
})

describe("skill runtime policy", () => {
  it("allows only skill-declared tools after activation", () => {
    setActiveSkillPolicy("s1", {
      skillId: "report",
      skillName: "Report",
      allowedTools: ["Read", "write"],
      executionContext: "inline",
    })

    expect(isToolAllowedByActiveSkillPolicy("s1", "read").allowed).toBe(true)
    expect(isToolAllowedByActiveSkillPolicy("s1", "write").allowed).toBe(true)
    expect(isToolAllowedByActiveSkillPolicy("s1", "bash").allowed).toBe(false)
  })

  it("permits subagent for forked skills even when not listed", () => {
    setActiveSkillPolicy("s1", {
      skillId: "forked",
      skillName: "Forked",
      allowedTools: ["read"],
      executionContext: "fork",
    })

    expect(isToolAllowedByActiveSkillPolicy("s1", "subagent").allowed).toBe(true)
  })

  it("executor blocks tools disallowed by the active skill", async () => {
    setActiveSkillPolicy("s1", {
      skillId: "safe-skill",
      skillName: "Safe Skill",
      allowedTools: ["read"],
      executionContext: "inline",
    })

    const tool: ToolDef = {
      id: "bash",
      description: "test",
      parameters: z.object({}),
      async execute() {
        return { output: "should not run" }
      },
    }
    const ctx: ToolContext = {
      sessionId: "s1",
      workdir: process.cwd(),
      signal: new AbortController().signal,
    }

    const result = await executeTool(tool, {}, ctx)

    expect(result.error).toContain("not allowed by active skill")
    expect(result.output).toBe("")
  })
})


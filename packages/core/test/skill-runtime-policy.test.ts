import { afterEach, describe, expect, it } from "bun:test"
import { z } from "zod"
import { executeTool } from "../src/tool/executor.js"
import type { ToolContext, ToolDef } from "../src/tool/types.js"
import {
  clearActiveSkillPolicy,
  getActiveSkillPolicy,
  getSkillLifecycleSnapshot,
  isToolAllowedByActiveSkillPolicy,
  popActiveSkillPolicy,
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

  it("tracks nested skill lifecycle and restores previous policy on pop", () => {
    setActiveSkillPolicy("s1", {
      skillId: "outer",
      skillName: "Outer",
      allowedTools: ["read"],
      executionContext: "inline",
    })
    setActiveSkillPolicy("s1", {
      skillId: "inner",
      skillName: "Inner",
      allowedTools: ["write"],
      executionContext: "inline",
    })

    expect(getActiveSkillPolicy("s1")?.skillId).toBe("inner")
    expect(getSkillLifecycleSnapshot("s1").stack.map(skill => skill.skillId)).toEqual(["outer", "inner"])
    expect(isToolAllowedByActiveSkillPolicy("s1", "read").allowed).toBe(false)
    expect(isToolAllowedByActiveSkillPolicy("s1", "write").allowed).toBe(true)

    expect(popActiveSkillPolicy("s1")?.skillId).toBe("inner")
    expect(getActiveSkillPolicy("s1")?.skillId).toBe("outer")
    expect(isToolAllowedByActiveSkillPolicy("s1", "read").allowed).toBe(true)
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

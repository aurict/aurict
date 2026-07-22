import { afterEach, describe, expect, it } from "bun:test"
import { mkdirSync, mkdtempSync, rmSync, symlinkSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { evaluateProjectAutoRequest } from "../src/permission/project-auto.js"
import type { PermissionRequest } from "../src/permission/types.js"

const temporaryRoots: string[] = []

function workspace(): string {
  const root = mkdtempSync(join(tmpdir(), "aurict-project-auto-"))
  temporaryRoots.push(root)
  return root
}

function request(overrides: Partial<PermissionRequest> = {}): PermissionRequest {
  return {
    id: "permission-test",
    tool: "write",
    pattern: "src/example.ts",
    level: "warning",
    ...overrides,
  }
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe("Project Auto permission policy", () => {
  it("allows typed file mutations contained by the project", async () => {
    const root = workspace()
    mkdirSync(join(root, "src"), { recursive: true })

    expect(await evaluateProjectAutoRequest(request(), root)).toEqual({
      allow: true,
      reason: "typed file mutation is contained by the project boundary",
    })
    expect(await evaluateProjectAutoRequest(request({
      tool: "apply_patch",
      pattern: "src/a.ts, src/b.ts",
      files: [
        { path: "src/a.ts", action: "update" },
        { path: "src/b.ts", action: "add" },
      ],
    }), root)).toMatchObject({ allow: true })
  })

  it("never auto-approves shell commands, including rm -rf", async () => {
    const root = workspace()
    const verdict = await evaluateProjectAutoRequest(request({
      tool: "bash",
      pattern: "rm -rf dist",
      level: "danger",
    }), root)

    expect(verdict.allow).toBe(false)
    expect(verdict.reason).toContain("typed file")
  })

  it("rejects paths outside the project and symlink escapes", async () => {
    const root = workspace()
    const outside = workspace()
    symlinkSync(outside, join(root, "linked"), "dir")

    expect((await evaluateProjectAutoRequest(request({ pattern: "../outside.ts" }), root)).allow).toBe(false)
    expect((await evaluateProjectAutoRequest(request({ pattern: "linked/escape.ts" }), root)).allow).toBe(false)
  })

  it("keeps secrets and internal state behind direct approval", async () => {
    const root = workspace()
    for (const path of [".env", ".env.local", ".git/config", ".aurict/config.json", "certs/app.key"]) {
      const verdict = await evaluateProjectAutoRequest(request({ pattern: path }), root)
      expect(verdict.allow).toBe(false)
    }
  })

  it("requires direct approval for broad patches", async () => {
    const root = workspace()
    const files = Array.from({ length: 11 }, (_, index) => ({
      path: `src/old-${index}.ts`,
      action: "delete" as const,
    }))
    const verdict = await evaluateProjectAutoRequest(request({
      tool: "apply_patch",
      pattern: "11 files",
      files,
      diff: { added: 0, removed: 110, fileCount: files.length },
    }), root)

    expect(verdict.allow).toBe(false)
    expect(verdict.reason).toContain("10 files")
  })
})

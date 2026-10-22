import { afterEach, describe, expect, it } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { PermissionStore, suggestCommandPrefix } from "../src/permission/store.js"

afterEach(() => PermissionStore.clear())

describe("command prefix rules", () => {
  it("suggests the first command of a single-line request", () => {
    expect(suggestCommandPrefix("echo hello world")).toBe("echo hello world")
    expect(suggestCommandPrefix("  git status  ")).toBe("git status")
    expect(suggestCommandPrefix("bun test && bun run lint")).toBe("bun test")
  })

  it("offers no prefix for multi-line commands or shell wrappers", () => {
    expect(suggestCommandPrefix("echo one\necho two")).toBeUndefined()
    expect(suggestCommandPrefix("bash -lc 'rm -rf /'")).toBeUndefined()
    expect(suggestCommandPrefix("sh -c ls")).toBeUndefined()
    expect(suggestCommandPrefix("bun run")).toBeUndefined()
  })

  it("approves commands that start with the prefix on a word boundary", () => {
    PermissionStore.approvePrefix("bash", "git status")
    expect(PermissionStore.isApproved("bash", "git status")).toBe(true)
    expect(PermissionStore.isApproved("bash", "git status --short")).toBe(true)
    expect(PermissionStore.isApproved("bash", "git statusx")).toBe(false)
    expect(PermissionStore.isApproved("bash", "git push")).toBe(false)
  })

  it("requires every chained command to match an approved prefix", () => {
    PermissionStore.approvePrefix("bash", "git status")
    expect(PermissionStore.isApproved("bash", "git status && rm -rf /")).toBe(false)
    PermissionStore.approvePrefix("bash", "git diff")
    expect(PermissionStore.isApproved("bash", "git status && git diff")).toBe(true)
  })

  it("never matches substitutions, redirections or multi-line input", () => {
    PermissionStore.approvePrefix("bash", "echo")
    expect(PermissionStore.isApproved("bash", "echo $(rm -rf /)")).toBe(false)
    expect(PermissionStore.isApproved("bash", "echo `id`")).toBe(false)
    expect(PermissionStore.isApproved("bash", "echo hi > ~/.bashrc")).toBe(false)
    expect(PermissionStore.isApproved("bash", "echo hi\nrm -rf /")).toBe(false)
  })

  it("keeps prefixes scoped to their tool and survives persistence", () => {
    const dir = mkdtempSync(join(tmpdir(), "aurict-perm-"))
    try {
      PermissionStore.approvePrefix("bash", "npm test")
      expect(PermissionStore.isApproved("write", "npm test")).toBe(false)
      const file = join(dir, "permissions.json")
      PermissionStore.savePersisted(file)
      PermissionStore.clear()
      expect(PermissionStore.isApproved("bash", "npm test")).toBe(false)
      PermissionStore.loadPersisted(file)
      expect(PermissionStore.isApproved("bash", "npm test -- --watch")).toBe(true)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

import { describe, it, expect } from "bun:test"
import { PermissionEvaluator } from "../src/permission/evaluator.js"
import { PermissionStore } from "../src/permission/store.js"

describe("PermissionEvaluator.evaluate", () => {
  // ── Always-allow tools ────────────────────────────────────────────────────

  it("read is always allowed", () => {
    expect(PermissionEvaluator.evaluate("read", "src/index.ts")).toBe("allow")
    expect(PermissionEvaluator.evaluate("read", "/etc/passwd")).toBe("allow")
  })

  it("glob is always allowed", () => {
    expect(PermissionEvaluator.evaluate("glob", "**/*.ts")).toBe("allow")
  })

  it("grep is always allowed", () => {
    expect(PermissionEvaluator.evaluate("grep", "TODO")).toBe("allow")
  })

  it("websearch is always allowed", () => {
    expect(PermissionEvaluator.evaluate("websearch", "bun runtime")).toBe("allow")
  })

  it("lsp is always allowed", () => {
    expect(PermissionEvaluator.evaluate("lsp", "typescript")).toBe("allow")
  })

  // ── Deny rules ────────────────────────────────────────────────────────────

  it("sudo bash is denied", () => {
    expect(PermissionEvaluator.evaluate("bash", "sudo rm -rf /")).toBe("deny")
  })

  it("write to /etc/ is denied", () => {
    expect(PermissionEvaluator.evaluate("write", "/etc/hosts")).toBe("deny")
  })

  it("write to /usr/ is denied", () => {
    expect(PermissionEvaluator.evaluate("write", "/usr/local/bin/evil")).toBe("deny")
  })

  it("write to /sys/ is denied", () => {
    expect(PermissionEvaluator.evaluate("write", "/sys/kernel")).toBe("deny")
  })

  // ── Ask rules ─────────────────────────────────────────────────────────────

  it("rm bash is ask", () => {
    expect(PermissionEvaluator.evaluate("bash", "rm file.txt")).toBe("ask")
  })

  it("rm -rf bash is ask", () => {
    expect(PermissionEvaluator.evaluate("bash", "rm -rf dist/")).toBe("ask")
  })

  it("curl bash is ask", () => {
    expect(PermissionEvaluator.evaluate("bash", "curl https://example.com")).toBe("ask")
  })

  it("shell remains a backwards-compatible alias for bash", () => {
    expect(PermissionEvaluator.evaluate("shell", "rm file.txt")).toBe("ask")
  })

  // ── Unknown tool defaults to ask ──────────────────────────────────────────

  it("unknown tool defaults to ask", () => {
    expect(PermissionEvaluator.evaluate("unknowntool", "something")).toBe("ask")
  })

  // ── Wildcard pattern matching ─────────────────────────────────────────────

  it("wildcard * matches any value", () => {
    expect(PermissionEvaluator.evaluate("task", "anything")).toBe("allow")
    expect(PermissionEvaluator.evaluate("memory", "random-pattern")).toBe("allow")
  })
})

describe("PermissionStore directory approvals", () => {
  it("approves paths inside the remembered directory only", () => {
    PermissionStore.clear()
    PermissionStore.approveDirectory("write", "src/features/auth/login.ts")

    expect(PermissionStore.isApproved("write", "src/features/auth/session.ts")).toBe(true)
    expect(PermissionStore.isApproved("write", "src/features/auth/nested/token.ts")).toBe(true)
    expect(PermissionStore.isApproved("write", "src/features/profile.ts")).toBe(false)
    expect(PermissionStore.isApproved("edit", "src/features/auth/session.ts")).toBe(false)

    PermissionStore.clear()
  })
})

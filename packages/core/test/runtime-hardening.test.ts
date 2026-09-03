import { afterEach, describe, expect, it } from "bun:test"
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { CoreMessage } from "ai"
import { createToolResultCache } from "../src/tool/cache.js"
import { PermissionStore } from "../src/permission/store.js"
import { splitTailTurns } from "../src/session/compaction.js"
import { resolveWithinWorkspace } from "../src/security/path-boundary.js"
import { assertSafeRemoteUrl } from "../src/security/network-policy.js"
import { AGENT_TYPE_TOOLS } from "../src/agent/protocol.js"
import { ToolRegistry } from "../src/tool/registry.js"
import { acquireSessionRun, isSessionRunActive } from "../src/server/run-lock.js"
import { jsonSchemaToZod } from "../src/mcp/bridge.js"
import { providerEnv, withProviderEnvironment } from "../src/provider/credentials.js"
import { httpRequestTool } from "../src/tool/built-in/http-request.js"

/** Windows refuses symlink creation without Developer Mode or admin rights.
 *  Probe once so the symlink-escape cases skip visibly instead of passing green
 *  without ever exercising the boundary they assert. */
const CAN_SYMLINK = (() => {
  const probe = mkdtempSync(join(tmpdir(), "aurict-symlink-probe-"))
  try {
    symlinkSync(probe, join(probe, "link"), "dir")
    return true
  } catch {
    return false
  } finally {
    rmSync(probe, { recursive: true, force: true })
  }
})()

const tempDirs: string[] = []

afterEach(() => {
  PermissionStore.clear()
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe("runtime isolation", () => {
  it("namespaces tool cache entries by runtime scope", () => {
    const cache = createToolResultCache()
    cache.set("read", { path: "src/index.ts" }, "workspace-a", undefined, "a\0session")
    expect(cache.get("read", { path: "src/index.ts" }, "b\0session")).toBeNull()
    expect(cache.get("read", { path: "src/index.ts" }, "a\0session")?.result).toBe("workspace-a")
  })

  it("keeps session approvals isolated while honoring global approvals", () => {
    PermissionStore.approve("write", "/project/a.ts", "session-a")
    expect(PermissionStore.isApproved("write", "/project/a.ts", "session-a")).toBe(true)
    expect(PermissionStore.isApproved("write", "/project/a.ts", "session-b")).toBe(false)
    PermissionStore.approve("write", "/project/global.ts")
    expect(PermissionStore.isApproved("write", "/project/global.ts", "session-b")).toBe(true)
  })

  it("allows only one active run per session", () => {
    const release = acquireSessionRun("session-a")
    expect(release).not.toBeNull()
    expect(isSessionRunActive("session-a")).toBe(true)
    expect(acquireSessionRun("session-a")).toBeNull()
    release?.()
    expect(isSessionRunActive("session-a")).toBe(false)
  })

  it("isolates provider credentials across concurrent async runs", async () => {
    const readAfterYield = (key: string) => withProviderEnvironment(
      { OPENAI_API_KEY: key },
      async () => {
        await Promise.resolve()
        return providerEnv("OPENAI_API_KEY")
      },
    )
    expect(await Promise.all([readAfterYield("key-a"), readAfterYield("key-b")])).toEqual(["key-a", "key-b"])
  })
})

describe("history integrity", () => {
  it("keeps complete tool turns in the compaction tail", () => {
    const messages: CoreMessage[] = [
      { role: "user", content: "first" },
      { role: "assistant", content: "answer" },
      { role: "user", content: "second" },
      { role: "assistant", content: [{ type: "tool-call", toolCallId: "x", toolName: "read", args: {} }] } as CoreMessage,
      { role: "tool", content: [{ type: "tool-result", toolCallId: "x", toolName: "read", result: "ok" }] } as CoreMessage,
      { role: "assistant", content: "done" },
    ]
    const { head, tail } = splitTailTurns(messages, 1)
    expect(head).toHaveLength(2)
    expect(tail).toEqual(messages.slice(2))
  })

})

describe("security boundaries", () => {
  it.skipIf(!CAN_SYMLINK)("rejects workspace symlink escapes", async () => {
    const root = mkdtempSync(join(tmpdir(), "aurict-boundary-root-"))
    const outside = mkdtempSync(join(tmpdir(), "aurict-boundary-outside-"))
    tempDirs.push(root, outside)
    writeFileSync(join(outside, "secret.txt"), "secret")
    mkdirSync(join(root, "links"))
    symlinkSync(outside, join(root, "links", "outside"))
    await expect(resolveWithinWorkspace(root, "links/outside/secret.txt")).rejects.toThrow("symlink")
  })

  it("rejects private network and credential-bearing URLs", async () => {
    await expect(assertSafeRemoteUrl("http://127.0.0.1/admin")).rejects.toThrow("private")
    await expect(assertSafeRemoteUrl("https://user:pass@example.com/")).rejects.toThrow("Credentials")
  })

  it("keeps declared read-only agent roles free of write tools", () => {
    for (const type of ["explore", "review", "test", "performance", "analytics", "security", "debug"] as const) {
      expect(AGENT_TYPE_TOOLS[type]).not.toContain("write")
      expect(AGENT_TYPE_TOOLS[type]).not.toContain("edit")
      expect(AGENT_TYPE_TOOLS[type]).not.toContain("apply_patch")
    }
  })

  it("requires confirmation for mutating or authenticated HTTP requests", () => {
    const confirmation = httpRequestTool.spec?.requiresConfirmation
    expect(typeof confirmation).toBe("function")
    if (typeof confirmation !== "function") return
    expect(confirmation({ method: "GET" })).toBe(false)
    expect(confirmation({ method: "POST" })).toBe(true)
    expect(confirmation({ method: "GET", auth: { type: "bearer", token: "secret" } })).toBe(true)
  })
})

describe("MCP lifecycle and schema", () => {
  it("unregisters dynamic tools", () => {
    const id = `test:${crypto.randomUUID()}`
    ToolRegistry.register({
      id,
      description: "test",
      parameters: jsonSchemaToZod({ type: "object" }),
      async execute() { return { output: "ok" } },
    })
    expect(ToolRegistry.has(id)).toBe(true)
    expect(ToolRegistry.unregister(id)).toBe(true)
    expect(ToolRegistry.has(id)).toBe(false)
  })

  it("validates nested objects, arrays, enums, and strict schemas", () => {
    const schema = jsonSchemaToZod({
      type: "object",
      additionalProperties: false,
      required: ["mode", "items"],
      properties: {
        mode: { type: "string", enum: ["safe", "active"] },
        items: { type: "array", items: { type: "object", required: ["count"], properties: { count: { type: "integer" } } } },
      },
    })
    expect(schema.safeParse({ mode: "safe", items: [{ count: 2 }] }).success).toBe(true)
    expect(schema.safeParse({ mode: "other", items: [] }).success).toBe(false)
    expect(schema.safeParse({ mode: "safe", items: [{ count: 1.5 }] }).success).toBe(false)
    expect(schema.safeParse({ mode: "safe", items: [], extra: true }).success).toBe(false)
  })
})

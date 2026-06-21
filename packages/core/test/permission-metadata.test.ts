import { describe, it, expect, afterEach } from "bun:test"
import { tmpdir } from "os"
import { join } from "path"
import { executeTool, ExecutorEvents, PermissionGate, PermissionStore } from "../src/index.js"
import { bashTool } from "../src/tool/built-in/bash.js"
import type { PermissionRequest } from "../src/index.js"

afterEach(() => {
  PermissionStore.clear()
  PermissionGate.cancelPending()
})

describe("permission request metadata", () => {
  it("includes bash sandbox and command metadata in permission prompts", async () => {
    let seen: PermissionRequest | null = null
    const off = ExecutorEvents.on((event) => {
      seen = event.request
      setTimeout(() => PermissionGate.respond(event.request.id, "deny"), 0)
    })

    const result = await executeTool(
      bashTool,
      { action: "run", command: "rm -rf build" },
      {
        workdir: join(tmpdir(), "aurict-permission-metadata"),
        sessionId: "test",
        signal: new AbortController().signal,
      },
    )

    off()

    expect(result.error).toContain("Permission denied by user")
    expect(seen?.tool).toBe("bash")
    expect(seen?.level).toBe("danger")
    expect(seen?.sandbox?.backend).toBe("policy")
    expect(seen?.sandbox?.envScrubbed).toBe(true)
    expect(seen?.command?.executables).toContain("rm")
  })
})

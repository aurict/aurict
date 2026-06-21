import { describe, it, expect, afterEach } from "bun:test"
import { tmpdir } from "os"
import { join } from "path"
import { mkdirSync, rmSync } from "fs"
import { executeTool, ExecutorEvents, PermissionGate, PermissionStore } from "../src/index.js"
import { bashTool } from "../src/tool/built-in/bash.js"
import { writeTool } from "../src/tool/built-in/write.js"
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

  it("does not ask permission for read-only ls commands", async () => {
    let asked = false
    const off = ExecutorEvents.on(() => { asked = true })

    const result = await executeTool(
      bashTool,
      { action: "run", command: "ls -la" },
      {
        workdir: tmpdir(),
        sessionId: "test",
        signal: new AbortController().signal,
      },
    )

    off()

    expect(result.error).toBeUndefined()
    expect(asked).toBe(false)
  })

  it("allow_directory remembers the normalized parent directory for later writes", async () => {
    const dir = join(tmpdir(), `aurict-allow-dir-${Date.now()}`)
    mkdirSync(dir, { recursive: true })
    let asks = 0
    const off = ExecutorEvents.on((event) => {
      asks++
      PermissionGate.respond(event.request.id, "allow_directory")
    })

    try {
      const first = await executeTool(
        writeTool,
        { path: "src/a.txt", content: "a" },
        {
          workdir: dir,
          sessionId: "test",
          signal: new AbortController().signal,
        },
      )
      const second = await executeTool(
        writeTool,
        { path: "src/b.txt", content: "b" },
        {
          workdir: dir,
          sessionId: "test",
          signal: new AbortController().signal,
        },
      )

      expect(first.error).toBeUndefined()
      expect(second.error).toBeUndefined()
      expect(asks).toBe(1)
    } finally {
      off()
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

import { afterEach, describe, expect, it } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { readToolOutputArtifact, storeToolOutputArtifact } from "../src/tool/output-artifacts.js"
import { readToolOutputTool } from "../src/tool/built-in/read-tool-output.js"

const directories: string[] = []

afterEach(async () => {
  await Promise.all(directories.splice(0).map(directory => rm(directory, { recursive: true, force: true })))
})

describe("tool output artifacts", () => {
  it("stores full output by content and reads deterministic slices", async () => {
    const workdir = await mkdtemp(join(tmpdir(), "aurict-tool-output-"))
    directories.push(workdir)
    const stored = await storeToolOutputArtifact({ workdir, sessionId: "s/1", output: "abcdefghij" })
    const duplicate = await storeToolOutputArtifact({ workdir, sessionId: "s/1", output: "abcdefghij" })
    expect(duplicate.handle).toBe(stored.handle)
    expect(await readToolOutputArtifact({ workdir, sessionId: "s/1", handle: stored.handle, offset: 3, limit: 4 }))
      .toEqual({ content: "defg", offset: 3, nextOffset: 7, totalChars: 10 })
  })

  it("does not allow a handle to escape its session scope", async () => {
    const workdir = await mkdtemp(join(tmpdir(), "aurict-tool-output-"))
    directories.push(workdir)
    const stored = await storeToolOutputArtifact({ workdir, sessionId: "one", output: "secret" })
    await expect(readToolOutputArtifact({ workdir, sessionId: "two", handle: stored.handle })).rejects.toThrow()
  })

  it("exposes a continuation offset through the model-facing tool", async () => {
    const workdir = await mkdtemp(join(tmpdir(), "aurict-tool-output-"))
    directories.push(workdir)
    const stored = await storeToolOutputArtifact({ workdir, sessionId: "s1", output: "abcdefghij" })
    const result = await readToolOutputTool.execute(
      { handle: stored.handle, offset: 0, limit: 4 },
      { workdir, sessionId: "s1", signal: new AbortController().signal },
    )
    expect(result.output).toContain("abcd")
    expect(result.output).toContain("offset=4")
  })
})

import { afterEach, describe, expect, it } from "bun:test"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { readImageTool } from "../src/tool/built-in/read-image.js"

const dirs: string[] = []
afterEach(async () => Promise.all(dirs.splice(0).map(dir => rm(dir, { recursive: true, force: true }))))

describe("read_image", () => {
  it("returns a multipart image without exposing base64 in display output", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aurict-image-")); dirs.push(dir)
    await writeFile(join(dir, "pixel.png"), Buffer.from("iVBORw0KGgo=", "base64"))
    const result = await readImageTool.execute({ path: "pixel.png" }, {
      sessionId: "test", workdir: dir, signal: new AbortController().signal, supportsVision: true,
    })
    expect(result.error).toBeUndefined()
    expect(result.content?.[0]?.type).toBe("image")
    expect(result.output).not.toContain("iVBOR")
  })

  it("fails clearly for non-vision models and workspace escapes", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aurict-image-")); dirs.push(dir)
    const noVision = await readImageTool.execute({ path: "pixel.png" }, {
      sessionId: "test", workdir: dir, signal: new AbortController().signal, supportsVision: false,
    })
    expect(noVision.error).toContain("does not support vision")
    const escaped = await readImageTool.execute({ path: "../pixel.png" }, {
      sessionId: "test", workdir: dir, signal: new AbortController().signal, supportsVision: true,
    })
    expect(escaped.error).toContain("outside workspace")
  })
})

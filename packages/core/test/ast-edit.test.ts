import { afterEach, describe, expect, it } from "bun:test"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { astEditTool } from "../src/tool/built-in/ast-edit.js"

const dirs: string[] = []
afterEach(async () => Promise.all(dirs.splice(0).map(dir => rm(dir, { recursive: true, force: true }))))
const context = (workdir: string, sessionId = "ast-test") => ({ sessionId, workdir, signal: new AbortController().signal })

describe("ast_edit", () => {
  it("requires a matching preview and applies a structural call edit", async () => {
    const workdir = await mkdtemp(join(tmpdir(), "aurict-ast-")); dirs.push(workdir)
    const path = join(workdir, "a.ts")
    await writeFile(path, "const result = api.oldCall(1, 2)\n")
    const args = { kind: "call_callee", match: "api.oldCall", replacement: "api.newCall", paths: ["a.ts"], max_files: 10 } as const
    const withoutPreview = await astEditTool.execute({ ...args, action: "apply" }, context(workdir))
    expect(withoutPreview.error).toContain("preview_id")
    const preview = await astEditTool.execute({ ...args, action: "preview" }, context(workdir))
    const previewId = (JSON.parse(preview.output) as { previewId: string }).previewId
    const applied = await astEditTool.execute({ ...args, action: "apply", preview_id: previewId }, context(workdir))
    expect(applied.error).toBeUndefined()
    expect(await Bun.file(path).text()).toContain("api.newCall(1, 2)")
  })

  it("rejects stale previews", async () => {
    const workdir = await mkdtemp(join(tmpdir(), "aurict-ast-")); dirs.push(workdir)
    const path = join(workdir, "a.ts")
    await writeFile(path, "import x from 'old-package'\n")
    const args = { kind: "import_source", match: "old-package", replacement: "new-package", paths: ["a.ts"], max_files: 10 } as const
    const preview = await astEditTool.execute({ ...args, action: "preview" }, context(workdir))
    const previewId = (JSON.parse(preview.output) as { previewId: string }).previewId
    await writeFile(path, "// changed\nimport x from 'old-package'\n")
    const applied = await astEditTool.execute({ ...args, action: "apply", preview_id: previewId }, context(workdir))
    expect(applied.error).toContain("changed after preview")
  })
})

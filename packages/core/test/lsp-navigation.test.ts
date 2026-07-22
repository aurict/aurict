import { afterEach, describe, expect, it } from "bun:test"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { lspTool } from "../src/tool/built-in/lsp.js"

const dirs: string[] = []
afterEach(async () => Promise.all(dirs.splice(0).map(dir => rm(dir, { recursive: true, force: true }))))

async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), "aurict-lsp-")); dirs.push(dir)
  await writeFile(join(dir, "a.ts"), "export function greet(name: string) { return `hi ${name}` }\n")
  await writeFile(join(dir, "b.ts"), "import { greet } from './a'\nexport const message = greet('Aurict')\n")
  await writeFile(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { moduleResolution: "Bundler", module: "ESNext" }, include: ["*.ts"] }))
  return dir
}

function context(workdir: string) {
  return { sessionId: "test", workdir, signal: new AbortController().signal }
}

describe("lsp TypeScript navigation", () => {
  it("finds definitions and references", async () => {
    const workdir = await fixture()
    const definition = await lspTool.execute({ action: "definition", language: "typescript", path: "b.ts", line: 2, column: 24 }, context(workdir))
    expect(definition.output).toContain("a.ts")
    const references = await lspTool.execute({ action: "references", language: "typescript", path: "a.ts", symbol: "greet" }, context(workdir))
    expect(references.output).toContain("b.ts")
  })

  it("previews and atomically applies a project rename", async () => {
    const workdir = await fixture()
    const preview = await lspTool.execute({ action: "rename_preview", language: "typescript", path: "a.ts", symbol: "greet", new_name: "welcome" }, context(workdir))
    expect(preview.output).toContain('"totalEdits"')
    const applied = await lspTool.execute({ action: "rename_apply", language: "typescript", path: "a.ts", symbol: "greet", new_name: "welcome" }, context(workdir))
    expect(applied.metadata?.changedFiles).toEqual(["a.ts", "b.ts"])
    expect(await Bun.file(join(workdir, "b.ts")).text()).toContain("welcome('Aurict')")
  })
})

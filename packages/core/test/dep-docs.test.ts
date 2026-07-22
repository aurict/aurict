import { afterEach, describe, expect, it } from "bun:test"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { depDocsTool } from "../src/tool/built-in/dep-docs.js"

const dirs: string[] = []
afterEach(async () => Promise.all(dirs.splice(0).map(dir => rm(dir, { recursive: true, force: true }))))

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "aurict-dep-")); dirs.push(root)
  const pkg = join(root, "node_modules", "sample-lib")
  await mkdir(pkg, { recursive: true })
  await writeFile(join(pkg, "package.json"), JSON.stringify({ name: "sample-lib", version: "3.2.1", types: "index.d.ts" }))
  await writeFile(join(pkg, "index.d.ts"), "export interface ParseResult { ok: boolean }\nexport declare function safeParse(value: unknown): ParseResult\n")
  await writeFile(join(pkg, "README.md"), "# sample-lib\n\n## Example\n```ts\nsafeParse(input)\n```\n")
  return root
}

const context = (workdir: string) => ({ sessionId: "test", workdir, signal: new AbortController().signal })

describe("dep_docs", () => {
  it("reports the exact installed version and declaration", async () => {
    const workdir = await fixture()
    const resolved = await depDocsTool.execute({ action: "resolve_package", package: "sample-lib", max_results: 12 }, context(workdir))
    expect(resolved.output).toContain("3.2.1")
    const type = await depDocsTool.execute({ action: "read_type", package: "sample-lib", symbol: "safeParse", max_results: 12 }, context(workdir))
    expect(type.output).toContain("ParseResult")
  })

  it("extracts installed documentation examples", async () => {
    const workdir = await fixture()
    const result = await depDocsTool.execute({ action: "show_examples", package: "sample-lib", query: "safeParse", max_results: 12 }, context(workdir))
    expect(result.output).toContain("safeParse(input)")
  })
})

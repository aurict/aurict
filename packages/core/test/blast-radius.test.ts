import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

let dir: string

beforeAll(() => {
  dir = join(tmpdir(), `blast-radius-test-${Date.now()}`)
  mkdirSync(dir, { recursive: true })

  writeFileSync(join(dir, "lib.ts"), `
export function greet(name: string): string {
  return \`Hello, \${name}\`
}

export function farewell(name: string): string {
  return greet(name) + " — goodbye!"
}
`.trim())

  writeFileSync(join(dir, "app.ts"), `
import { greet } from "./lib"

export function run() {
  const msg = greet("world")
  console.log(msg)
}
`.trim())

  writeFileSync(join(dir, "utils.ts"), `
import { greet } from "./lib"

export const helper = () => greet("util")
`.trim())

  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({
    compilerOptions: { strict: true, module: "ESNext", moduleResolution: "Bundler", noEmit: true },
    include: ["*.ts"],
  }))
})

afterAll(() => {
  rmSync(dir, { recursive: true, force: true })
})

function ctx() {
  return {
    workdir: dir,
    sessionId: "test",
    signal: new AbortController().signal,
  }
}

describe("blast_radius", () => {
  it("finds all call sites for a known symbol", async () => {
    const { blastRadiusTool } = await import("../src/tool/built-in/blast-radius.js")
    const res = await blastRadiusTool.execute(
      { symbol: "greet", file: "lib.ts" },
      ctx(),
    )

    expect(res.error).toBeUndefined()
    expect(res.output).toContain("greet")
    expect(res.output).toContain("app.ts")
    expect(res.output).toContain("utils.ts")
  })

  it("returns call site count in output", async () => {
    const { blastRadiusTool } = await import("../src/tool/built-in/blast-radius.js")
    const res = await blastRadiusTool.execute(
      { symbol: "greet", file: "lib.ts" },
      ctx(),
    )

    // farewell() in lib.ts + run() in app.ts + helper in utils.ts = at least 3 refs
    expect(res.output).toMatch(/\d+ call site/)
  })

  it("returns valid JSON in json mode", async () => {
    const { blastRadiusTool } = await import("../src/tool/built-in/blast-radius.js")
    const res = await blastRadiusTool.execute(
      { symbol: "greet", file: "lib.ts", json: true },
      ctx(),
    )

    expect(res.error).toBeUndefined()
    const parsed = JSON.parse(res.output) as { symbol: string; refs: unknown[] }
    expect(parsed.symbol).toBe("greet")
    expect(Array.isArray(parsed.refs)).toBe(true)
    expect(parsed.refs.length).toBeGreaterThan(0)
  })

  it("errors on unknown symbol", async () => {
    const { blastRadiusTool } = await import("../src/tool/built-in/blast-radius.js")
    const res = await blastRadiusTool.execute(
      { symbol: "phantomSymbol" },
      ctx(),
    )

    expect(res.error).toBeDefined()
    expect(res.error).toContain("not found")
  })

  it("errors when symbol param is empty", async () => {
    const { blastRadiusTool } = await import("../src/tool/built-in/blast-radius.js")
    const res = await blastRadiusTool.execute({ symbol: "" }, ctx())
    expect(res.error).toBeDefined()
  })

  it("simulates breaks with the project's real tsconfig and reports its bounded scope", async () => {
    const { blastRadiusTool } = await import("../src/tool/built-in/blast-radius.js")
    const res = await blastRadiusTool.execute({
      symbol: "greet",
      file: "lib.ts",
      mode: "breaks",
      from: "name: string",
      to: "name: number",
      json: true,
    }, ctx())

    expect(res.error).toBeUndefined()
    const parsed = JSON.parse(res.output) as {
      breaks: { clean: boolean; applied: boolean; breaks: Array<{ file: string }>; scope: { configFiles: string[] } }
    }
    expect(parsed.breaks.applied).toBe(true)
    expect(parsed.breaks.clean).toBe(false)
    expect(parsed.breaks.breaks.some(site => site.file === "app.ts")).toBe(true)
    expect(parsed.breaks.scope.configFiles).toContain("tsconfig.json")
  })

  it("rejects declaration hints outside the workspace", async () => {
    const { blastRadiusTool } = await import("../src/tool/built-in/blast-radius.js")
    const res = await blastRadiusTool.execute({ symbol: "greet", file: "../outside.ts" }, ctx())
    expect(res.error).toContain("escapes working directory")
  })

  it("honors an already-aborted analysis signal", async () => {
    const { blastRadiusTool } = await import("../src/tool/built-in/blast-radius.js")
    const controller = new AbortController()
    controller.abort()
    const res = await blastRadiusTool.execute({ symbol: "greet", file: "lib.ts" }, { ...ctx(), signal: controller.signal })
    expect(res.error).toContain("cancelled")
  })

  it("follows project references and path mappings across packages", async () => {
    const root = mkdtempSync(join(tmpdir(), "blast-radius-project-refs-"))
    const lib = join(root, "packages", "lib")
    const app = join(root, "packages", "app")
    mkdirSync(join(lib, "src"), { recursive: true })
    mkdirSync(join(app, "src"), { recursive: true })
    writeFileSync(join(root, "tsconfig.json"), JSON.stringify({ files: [], references: [{ path: "./packages/lib/tsconfig.lib.json" }, { path: "./packages/app" }] }))
    writeFileSync(join(lib, "tsconfig.lib.json"), JSON.stringify({ compilerOptions: { composite: true, strict: true }, include: ["src/**/*.ts"] }))
    writeFileSync(join(app, "tsconfig.json"), JSON.stringify({
      compilerOptions: { composite: true, strict: true, baseUrl: ".", paths: { "@fixture/lib": ["../lib/src/index.ts"] } },
      references: [{ path: "../lib" }],
      include: ["src/**/*.ts"],
    }))
    writeFileSync(join(lib, "src", "index.ts"), "export function shared(value: string) { return value.length }")
    writeFileSync(join(app, "src", "index.ts"), "import { shared } from '@fixture/lib'\nexport const size = shared('value')")

    try {
      const { blastRadiusTool } = await import("../src/tool/built-in/blast-radius.js")
      const res = await blastRadiusTool.execute({ symbol: "shared", file: "packages/lib/src/index.ts", json: true }, {
        workdir: root,
        sessionId: "project-refs",
        signal: new AbortController().signal,
      })
      expect(res.error).toBeUndefined()
      const parsed = JSON.parse(res.output) as { refs: Array<{ file: string }>; scope: { configFiles: string[] } }
      expect(parsed.refs.some(ref => ref.file === "packages/app/src/index.ts")).toBe(true)
      expect(parsed.scope.configFiles).toEqual(expect.arrayContaining(["packages/lib/tsconfig.lib.json", "packages/app/tsconfig.json"]))
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})

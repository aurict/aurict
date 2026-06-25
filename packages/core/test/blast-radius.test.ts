import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { mkdirSync, writeFileSync, rmSync } from "fs"
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
})

afterAll(() => {
  try { rmSync(dir, { recursive: true, force: true }) } catch {}
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
})

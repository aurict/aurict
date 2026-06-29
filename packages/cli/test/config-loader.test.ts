import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs"
import { homedir, tmpdir } from "node:os"
import { join } from "node:path"
import { applyFlags, loadConfig } from "../src/config/loader.js"

const GLOBAL_PATH = join(homedir(), ".aurict", "config.json")
let savedGlobalConfig: string | null = null
let dirs: string[] = []

beforeAll(() => {
  savedGlobalConfig = existsSync(GLOBAL_PATH) ? readFileSync(GLOBAL_PATH, "utf8") : null
  mkdirSync(join(homedir(), ".aurict"), { recursive: true })
  writeFileSync(GLOBAL_PATH, "{}", "utf8")
})

afterEach(() => {
  writeFileSync(GLOBAL_PATH, "{}", "utf8")
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
  dirs = []
})

afterAll(() => {
  if (savedGlobalConfig !== null) {
    writeFileSync(GLOBAL_PATH, savedGlobalConfig, "utf8")
  } else if (existsSync(GLOBAL_PATH)) {
    unlinkSync(GLOBAL_PATH)
  }
})

describe("CLI config loader", () => {
  it("flattens canonical defaults for CLI bootstrap", () => {
    writeFileSync(GLOBAL_PATH, JSON.stringify({
      defaults: { provider: "anthropic", model: "claude-test" },
    }), "utf8")

    const cfg = loadConfig(projectDir())
    expect(cfg.provider).toBe("anthropic")
    expect(cfg.model).toBe("claude-test")
    expect(cfg.defaults?.provider).toBe("anthropic")
  })

  it("preserves legacy top-level provider/model over canonical defaults", () => {
    writeFileSync(GLOBAL_PATH, JSON.stringify({
      provider: "openai",
      model: "gpt-test",
      defaults: { provider: "anthropic", model: "claude-test" },
    }), "utf8")

    const cfg = loadConfig(projectDir())
    expect(cfg.provider).toBe("openai")
    expect(cfg.model).toBe("gpt-test")
    expect(cfg.defaults?.provider).toBe("anthropic")
  })

  it("keeps CLI-only server config while using core canonical fields", () => {
    const dir = projectDir()
    mkdirSync(join(dir, ".aurict"), { recursive: true })
    writeFileSync(join(dir, ".aurict", "config.json"), JSON.stringify({
      server: { port: 9123 },
      longTaskRuntime: { mode: "shadow" },
    }), "utf8")

    const cfg = loadConfig(dir)
    expect(cfg.server?.port).toBe(9123)
    expect(cfg.longTaskRuntime?.mode).toBe("shadow")
  })

  it("applies CLI flags last", () => {
    const cfg = applyFlags({ provider: "anthropic", model: "claude-test" }, {
      provider: "openai",
      model: "gpt-test",
      stream: false,
    })

    expect(cfg.provider).toBe("openai")
    expect(cfg.model).toBe("gpt-test")
    expect(cfg.stream).toBe(false)
  })
})

function projectDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "aurict-cli-config-"))
  dirs.push(dir)
  return dir
}

import { describe, it, expect, beforeAll, afterAll, afterEach } from "bun:test"
import {
  mkdirSync, existsSync, readFileSync, writeFileSync, unlinkSync,
  mkdtempSync, rmSync,
} from "node:fs"
import { tmpdir, homedir } from "node:os"
import { join } from "node:path"
import {
  loadConfig, resolveLongTaskRuntimeConfig, resolveSecuritySandboxConfig, SECURITY_SANDBOX_IMAGE_DEFAULTS, setApiKey, setDefault, setCompaction, setLongTaskRuntime, setSecuritySandbox, getConfigPath,
} from "../src/config/config.js"

const GLOBAL_PATH = join(homedir(), ".aurict", "config.json")

// Env vars setApiKey touches — save + restore around the whole suite
const TRACKED_ENV = [
  "ANTHROPIC_API_KEY", "OPENAI_API_KEY", "OPENROUTER_API_KEY",
  "GOOGLE_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "OPENCODE_API_KEY",
  "XAI_API_KEY", "AZURE_OPENAI_API_KEY", "AWS_ACCESS_KEY_ID",
]
const savedEnv: Record<string, string | undefined> = {}
let savedGlobalConfig: string | null = null

beforeAll(() => {
  // Save env vars and clear them so tests start clean
  for (const v of TRACKED_ENV) {
    savedEnv[v] = process.env[v]
    delete process.env[v]
  }
  // Backup and reset global config
  savedGlobalConfig = existsSync(GLOBAL_PATH) ? readFileSync(GLOBAL_PATH, "utf8") : null
  mkdirSync(join(homedir(), ".aurict"), { recursive: true })
  writeFileSync(GLOBAL_PATH, "{}", "utf8")
})

afterAll(() => {
  // Restore env vars
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v !== undefined) process.env[k] = v
    else delete process.env[k]
  }
  // Restore global config
  if (savedGlobalConfig !== null) {
    writeFileSync(GLOBAL_PATH, savedGlobalConfig, "utf8")
  } else if (existsSync(GLOBAL_PATH)) {
    unlinkSync(GLOBAL_PATH)
  }
})

afterEach(() => {
  // Reset global config to empty between tests
  writeFileSync(GLOBAL_PATH, "{}", "utf8")
  // Clear any env vars the test may have set
  for (const v of TRACKED_ENV) delete process.env[v]
})

// ─── loadConfig ──────────────────────────────────────────────────────────────

describe("loadConfig", () => {
  it("returns empty config when global file is empty {}", () => {
    const cfg = loadConfig()
    expect(cfg).toBeDefined()
    expect(typeof cfg).toBe("object")
  })

  it("returns {} when project dir has no config file", () => {
    const cfg = loadConfig("/nonexistent/path/does/not/exist")
    expect(cfg).toBeDefined()
  })

  it("reads project-level config from projectDir", () => {
    const projDir = mkdtempSync(join(tmpdir(), "aurict-proj-"))
    try {
      mkdirSync(join(projDir, ".aurict"), { recursive: true })
      writeFileSync(
        join(projDir, ".aurict", "config.json"),
        JSON.stringify({ defaults: { provider: "openai", model: "gpt-4o" } }),
        "utf8",
      )
      const cfg = loadConfig(projDir)
      expect(cfg.defaults?.provider).toBe("openai")
      expect(cfg.defaults?.model).toBe("gpt-4o")
    } finally {
      rmSync(projDir, { recursive: true, force: true })
    }
  })

  it("project config merges with global config (project wins on conflict)", () => {
    writeFileSync(GLOBAL_PATH, JSON.stringify({ defaults: { provider: "anthropic", model: "claude-opus-4-8" } }), "utf8")
    const projDir = mkdtempSync(join(tmpdir(), "aurict-proj2-"))
    try {
      mkdirSync(join(projDir, ".aurict"), { recursive: true })
      writeFileSync(
        join(projDir, ".aurict", "config.json"),
        JSON.stringify({ defaults: { model: "gpt-4o" } }),
        "utf8",
      )
      const cfg = loadConfig(projDir)
      expect(cfg.defaults?.provider).toBe("anthropic")   // from global
      expect(cfg.defaults?.model).toBe("gpt-4o")         // project overrides
    } finally {
      rmSync(projDir, { recursive: true, force: true })
    }
  })

  it("env var overrides provider api key from config", () => {
    writeFileSync(GLOBAL_PATH, JSON.stringify({
      providers: { openai: { apiKey: "sk-from-file" } },
    }), "utf8")
    process.env["OPENAI_API_KEY"] = "sk-from-env"
    const cfg = loadConfig()
    expect(cfg.providers?.["openai"]?.apiKey).toBe("sk-from-env")
  })

  it("env var injects provider even when not in config file", () => {
    process.env["ANTHROPIC_API_KEY"] = "sk-ant-injected"
    const cfg = loadConfig()
    expect(cfg.providers?.["anthropic"]?.apiKey).toBe("sk-ant-injected")
  })

  it("loadConfig without any env vars returns no provider keys", () => {
    const cfg = loadConfig()
    // No providers set in either config file or env vars
    const hasAnyKey = Object.values(cfg.providers ?? {}).some((p) => p.apiKey)
    expect(hasAnyKey).toBe(false)
  })
})

// ─── setApiKey ───────────────────────────────────────────────────────────────

describe("setApiKey", () => {
  it("sets process.env for openai", () => {
    setApiKey("openai", "sk-test-openai")
    expect(process.env["OPENAI_API_KEY"]).toBe("sk-test-openai")
  })

  it("sets process.env for anthropic", () => {
    setApiKey("anthropic", "sk-ant-test")
    expect(process.env["ANTHROPIC_API_KEY"]).toBe("sk-ant-test")
  })

  it("persists key to global config on disk", () => {
    setApiKey("openai", "sk-persisted")
    const raw = JSON.parse(readFileSync(GLOBAL_PATH, "utf8"))
    expect(raw.providers?.openai?.apiKey).toBe("sk-persisted")
  })

  it("subsequent setApiKey for same provider overwrites previous", () => {
    setApiKey("openai", "sk-first")
    setApiKey("openai", "sk-second")
    const raw = JSON.parse(readFileSync(GLOBAL_PATH, "utf8"))
    expect(raw.providers?.openai?.apiKey).toBe("sk-second")
  })

  it("loadConfig reflects the key set by setApiKey (via env var)", () => {
    setApiKey("openai", "sk-roundtrip")
    const cfg = loadConfig()
    expect(cfg.providers?.["openai"]?.apiKey).toBe("sk-roundtrip")
  })
})

// ─── setDefault ──────────────────────────────────────────────────────────────

describe("setDefault", () => {
  it("saves default provider", () => {
    setDefault("provider", "openai")
    const cfg = loadConfig()
    expect(cfg.defaults?.provider).toBe("openai")
  })

  it("saves default model", () => {
    setDefault("model", "gpt-4o")
    const cfg = loadConfig()
    expect(cfg.defaults?.model).toBe("gpt-4o")
  })

  it("saves effort as number (not string)", () => {
    setDefault("effort", 8000)
    const raw = JSON.parse(readFileSync(GLOBAL_PATH, "utf8"))
    expect(typeof raw.defaults?.effort).toBe("number")
    expect(raw.defaults?.effort).toBe(8000)
  })

  it("overwrites previous default", () => {
    setDefault("provider", "anthropic")
    setDefault("provider", "openai")
    const cfg = loadConfig()
    expect(cfg.defaults?.provider).toBe("openai")
  })
})

// ─── setCompaction ───────────────────────────────────────────────────────────

describe("setCompaction", () => {
  it("persists strategy to disk", () => {
    setCompaction({ strategy: "aggressive" })
    const raw = JSON.parse(readFileSync(GLOBAL_PATH, "utf8"))
    expect(raw.compaction?.strategy).toBe("aggressive")
  })

  it("persists tailTurns to disk", () => {
    setCompaction({ tailTurns: 5 })
    const raw = JSON.parse(readFileSync(GLOBAL_PATH, "utf8"))
    expect(raw.compaction?.tailTurns).toBe(5)
  })

  it("merges with existing compaction settings", () => {
    setCompaction({ strategy: "conservative" })
    setCompaction({ tailTurns: 3 })
    const raw = JSON.parse(readFileSync(GLOBAL_PATH, "utf8"))
    expect(raw.compaction?.strategy).toBe("conservative")
    expect(raw.compaction?.tailTurns).toBe(3)
  })
})

// ─── setSecuritySandbox ──────────────────────────────────────────────────────

describe("setSecuritySandbox", () => {
  it("persists disabled security sandbox state", () => {
    setSecuritySandbox({ enabled: false, profile: "off" })
    const cfg = loadConfig()
    expect(cfg.securitySandbox?.enabled).toBe(false)
    expect(cfg.securitySandbox?.profile).toBe("off")
  })

  it("merges security sandbox settings without dropping existing allowlist", () => {
    setSecuritySandbox({ targetAllowlist: ["example.com"] })
    setSecuritySandbox({ enabled: true, profile: "active-lite", image: "aurict-security-lite:local" })
    const cfg = loadConfig()
    expect(cfg.securitySandbox?.enabled).toBe(true)
    expect(cfg.securitySandbox?.profile).toBe("active-lite")
    expect(cfg.securitySandbox?.image).toBe("aurict-security-lite:local")
    expect(cfg.securitySandbox?.targetAllowlist).toEqual(["example.com"])
  })
})

describe("resolveSecuritySandboxConfig", () => {
  it("defaults to off when security sandbox is absent", () => {
    const security = resolveSecuritySandboxConfig({})
    expect(security.enabled).toBe(false)
    expect(security.profile).toBe("off")
    expect(security.network).toBe("none")
  })

  it("fills active-lite defaults deterministically", () => {
    const security = resolveSecuritySandboxConfig({ securitySandbox: { enabled: true, profile: "active-lite" } })
    expect(security.image).toBe(SECURITY_SANDBOX_IMAGE_DEFAULTS["active-lite"])
    expect(security.network).toBe("restricted")
    expect(security.maxConcurrent).toBe(1)
    expect(security.requestsPerMinute).toBe(60)
  })

  it("fills stricter kali-full defaults", () => {
    const security = resolveSecuritySandboxConfig({ securitySandbox: { enabled: true, profile: "kali-full" } })
    expect(security.image).toBe(SECURITY_SANDBOX_IMAGE_DEFAULTS["kali-full"])
    expect(security.maxConcurrent).toBe(1)
    expect(security.requestsPerMinute).toBe(30)
    expect(security.requireApprovalFor).toContain("kali-full-profile")
  })
})

describe("resolveLongTaskRuntimeConfig", () => {
  it("defaults to enabled soft mode", () => {
    const runtime = resolveLongTaskRuntimeConfig({})
    expect(runtime.enabled).toBe(true)
    expect(runtime.mode).toBe("soft")
    expect(runtime.strictVerification).toBe(true)
  })

  it("turns off when mode is off", () => {
    const runtime = resolveLongTaskRuntimeConfig({ longTaskRuntime: { mode: "off" } })
    expect(runtime.enabled).toBe(false)
    expect(runtime.mode).toBe("off")
  })

  it("normalizes numeric budgets", () => {
    const runtime = resolveLongTaskRuntimeConfig({
      longTaskRuntime: {
        maxContinuationSteps: 4.8,
        maxRecoveryAttempts: -1,
      },
    })
    expect(runtime.maxContinuationSteps).toBe(4)
    expect(runtime.maxRecoveryAttempts).toBe(0)
  })
})

describe("setLongTaskRuntime", () => {
  it("persists long-task runtime mode", () => {
    setLongTaskRuntime({ mode: "shadow", enabled: true })
    const runtime = resolveLongTaskRuntimeConfig(loadConfig())
    expect(runtime.mode).toBe("shadow")
    expect(runtime.enabled).toBe(true)
  })
})

// ─── getConfigPath ───────────────────────────────────────────────────────────

describe("getConfigPath", () => {
  it("returns a path containing .aurict and config.json", () => {
    const p = getConfigPath()
    expect(p).toContain(".aurict")
    expect(p).toContain("config.json")
  })

  it("returns path under home directory", () => {
    const p = getConfigPath()
    expect(p).toContain(homedir())
  })
})

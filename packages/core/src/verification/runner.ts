import { join } from "node:path"
import { existsSync, readFileSync } from "node:fs"
import { createHash } from "node:crypto"

const TEST_TIMEOUT_MS = 30_000

// ── Framework tespiti ─────────────────────────────────────────────────────────

interface Framework {
  name:    string
  command: (files: string[], workdir: string) => string[]
}

function readPkgJson(workdir: string): Record<string, unknown> {
  try {
    const p = join(workdir, "package.json")
    if (!existsSync(p)) return {}
    return JSON.parse(readFileSync(p, "utf8")) as Record<string, unknown>
  } catch { return {} }
}

function hasDep(pkg: Record<string, unknown>, name: string): boolean {
  const deps = [
    ...(Object.keys((pkg["dependencies"]        as Record<string,unknown> | undefined) ?? {})),
    ...(Object.keys((pkg["devDependencies"]      as Record<string,unknown> | undefined) ?? {})),
    ...(Object.keys((pkg["peerDependencies"]     as Record<string,unknown> | undefined) ?? {})),
  ]
  return deps.includes(name)
}

function hasFile(workdir: string, ...names: string[]): boolean {
  return names.some(n => existsSync(join(workdir, n)))
}

function detectFramework(workdir: string): Framework | null {
  const pkg = readPkgJson(workdir)

  // Bun test — bun projelerinde öncelikli
  if (hasFile(workdir, "bun.lockb", "bun.lock")) {
    return {
      name: "bun",
      command: (files) => files.length > 0
        ? ["bun", "test", ...files]
        : ["bun", "test"],
    }
  }

  // Vitest
  if (hasDep(pkg, "vitest") || hasFile(workdir, "vitest.config.ts", "vitest.config.js")) {
    return {
      name: "vitest",
      command: (files) => files.length > 0
        ? ["bunx", "vitest", "run", ...files]
        : ["bunx", "vitest", "run"],
    }
  }

  // Jest
  if (hasDep(pkg, "jest") || hasFile(workdir, "jest.config.ts", "jest.config.js", "jest.config.mjs")) {
    return {
      name: "jest",
      command: (files) => files.length > 0
        ? ["bunx", "jest", "--passWithNoTests", ...files]
        : ["bunx", "jest", "--passWithNoTests"],
    }
  }

  // pytest (Python)
  if (hasFile(workdir, "pytest.ini", "setup.cfg", "pyproject.toml") || hasFile(workdir, "conftest.py")) {
    return {
      name: "pytest",
      command: (files) => files.length > 0
        ? ["python", "-m", "pytest", "-q", ...files]
        : ["python", "-m", "pytest", "-q"],
    }
  }

  // Go test
  if (hasFile(workdir, "go.mod")) {
    return {
      name: "go",
      command: () => ["go", "test", "./..."],
    }
  }

  // Cargo test (Rust)
  if (hasFile(workdir, "Cargo.toml")) {
    return {
      name: "cargo",
      command: () => ["cargo", "test", "--quiet"],
    }
  }

  // dotnet test (C#)
  if (hasFile(workdir, "*.sln") || hasFile(workdir, "*.csproj")) {
    return {
      name: "dotnet",
      command: () => ["dotnet", "test", "--no-build", "-q"],
    }
  }

  return null
}

// ── Sonuç önbelleği ───────────────────────────────────────────────────────────

interface CacheEntry {
  output: string
  passed: boolean
  ts:     number
}

const CACHE_TTL_MS = 60_000
const MAX_CACHE    = 100
const cache        = new Map<string, CacheEntry>()

function cacheKey(files: string[], workdir: string): string {
  return createHash("sha1").update(workdir + files.sort().join(",")).digest("hex")
}

function cacheGet(key: string): CacheEntry | null {
  const e = cache.get(key)
  if (!e) return null
  if (Date.now() - e.ts > CACHE_TTL_MS) { cache.delete(key); return null }
  // LRU: re-insert to move to tail (Map preserves insertion order)
  cache.delete(key)
  cache.set(key, e)
  return e
}

function cacheSet(key: string, entry: CacheEntry): void {
  if (cache.has(key)) cache.delete(key)          // refresh position
  else if (cache.size >= MAX_CACHE) {
    const lru = cache.keys().next().value          // head = least recently used
    if (lru !== undefined) cache.delete(lru)
  }
  cache.set(key, entry)
}

// ── Test çalıştırıcı ──────────────────────────────────────────────────────────

export interface TestRunResult {
  output:    string
  passed:    boolean
  framework: string
  cached:    boolean
}

export async function runRelatedTests(
  files:   string[],
  workdir: string,
  signal:  AbortSignal,
): Promise<TestRunResult> {
  const framework = detectFramework(workdir)

  if (!framework) {
    return {
      output:    "No test framework detected (checked: bun, vitest, jest, pytest, go, cargo, dotnet).",
      passed:    true,
      framework: "none",
      cached:    false,
    }
  }

  const key     = cacheKey(files, workdir)
  const cached  = cacheGet(key)
  if (cached) {
    return { ...cached, framework: framework.name, cached: true }
  }

  const cmd = framework.command(files, workdir)

  let output = ""
  let passed = false

  try {
    const { spawn } = await import("bun")
    const proc  = spawn(cmd, {
      cwd:    workdir,
      stdout: "pipe",
      stderr: "pipe",
      env:    { ...process.env, CI: "true", NO_COLOR: "1" },
    })

    // AbortSignal → process kill
    const onAbort = () => { try { proc.kill() } catch { /* zaten kapanmış */ } }
    if (signal.aborted) { onAbort(); throw new Error("aborted") }
    signal.addEventListener("abort", onAbort, { once: true })

    const timer = setTimeout(onAbort, TEST_TIMEOUT_MS)

    const [out, err, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ])
    clearTimeout(timer)
    signal.removeEventListener("abort", onAbort)

    const raw = (out + err).trim()
    passed = exitCode === 0
    output = raw.slice(0, 4_000) + (raw.length > 4_000 ? "\n[truncated]" : "")
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg === "aborted") {
      output = `Test run aborted (timeout ${TEST_TIMEOUT_MS / 1000}s or signal).`
    } else {
      output = `Test runner error: ${msg}`
    }
    passed = false
  }

  const entry: CacheEntry = { output, passed, ts: Date.now() }
  cacheSet(key, entry)

  return { output, passed, framework: framework.name, cached: false }
}

export { detectFramework }

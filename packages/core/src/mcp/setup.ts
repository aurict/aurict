/**
 * First-time MCP prerequisite installer.
 * Runs on first Aurict launch to install tools that can't self-bootstrap.
 * Codegraph is wired into Aurict natively — no interactive "codegraph install" needed.
 * We install the binary, init the project index, and patch AGENTS.md ourselves.
 */

import { execSync, spawnSync } from "child_process"
import { existsSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"

export type SetupStatus = "installed" | "ready" | "failed" | "skipped"

export interface MCPSetupResult {
  name:    string
  label:   string
  status:  SetupStatus
  error?:  string
}

function commandExists(cmd: string): boolean {
  try {
    execSync(
      process.platform === "win32" ? `where ${cmd}` : `which ${cmd}`,
      { stdio: "pipe" },
    )
    return true
  } catch {
    return false
  }
}

async function installCodegraph(): Promise<MCPSetupResult> {
  const name  = "codegraph"
  const label = "semantic code intelligence"

  if (commandExists("codegraph")) {
    return { name, label, status: "ready" }
  }

  // Prefer bun global install if available (matches Aurict runtime), else npm
  const installer = commandExists("bun") ? "bun" : commandExists("npm") ? "npm" : null
  if (!installer) {
    return { name, label, status: "skipped", error: "no package manager found" }
  }

  const args =
    installer === "bun"
      ? ["add", "-g", "@colbymchenry/codegraph"]
      : ["install", "-g", "@colbymchenry/codegraph"]

  const result = spawnSync(installer, args, {
    stdio:   "pipe",
    timeout: 120_000,
  })

  if (result.status === 0 && commandExists("codegraph")) {
    return { name, label, status: "installed" }
  }

  const stderr = result.stderr?.toString().trim() ?? ""
  return {
    name,
    label,
    status: "failed",
    error:  stderr.slice(0, 120) || "install returned non-zero exit",
  }
}

export interface SetupEntry {
  name:   string
  label:  string
  check:  () => MCPSetupResult | Promise<MCPSetupResult>
}

async function installUv(): Promise<MCPSetupResult> {
  const name  = "uv"
  const label = "Python runtime for git/fetch MCP servers"

  if (commandExists("uvx") || commandExists("uv")) {
    return { name, label, status: "ready" }
  }

  // Try pip first (safer, no curl-pipe-sh), then fall back to the official installer
  if (commandExists("pip3") || commandExists("pip")) {
    const pip = commandExists("pip3") ? "pip3" : "pip"
    const r = spawnSync(pip, ["install", "uv"], { stdio: "pipe", timeout: 60_000 })
    if (r.status === 0 && (commandExists("uvx") || commandExists("uv"))) {
      return { name, label, status: "installed" }
    }
  }

  if (commandExists("curl") && process.platform !== "win32") {
    const r = spawnSync(
      "sh",
      ["-c", "curl -LsSf https://astral.sh/uv/install.sh | sh"],
      { stdio: "pipe", timeout: 60_000 },
    )
    if (r.status === 0 && (commandExists("uvx") || commandExists("uv"))) {
      return { name, label, status: "installed" }
    }
  }

  return { name, label, status: "failed", error: "install uv manually: pip install uv" }
}

const SETUP_ENTRIES: SetupEntry[] = [
  { name: "codegraph", label: "semantic code intelligence", check: installCodegraph },
  { name: "uv",        label: "Python runtime (git/fetch)", check: installUv },
]

export { installCodegraph, installUv }

export async function runMCPSetup(): Promise<MCPSetupResult[]> {
  const results: MCPSetupResult[] = []
  for (const entry of SETUP_ENTRIES) {
    results.push(await entry.check())
  }
  return results
}

// ── Post-install wiring ────────────────────────────────────────────────────────

const CODEGRAPH_AGENTS_MARKER = "<!-- codegraph-aurict -->"

const CODEGRAPH_AGENTS_BLOCK = `${CODEGRAPH_AGENTS_MARKER}
## CodeGraph — Semantic Code Intelligence

This project has a CodeGraph index. Use \`codegraph_explore\` (via MCP) to answer
structural questions, trace call paths, and find symbol definitions instead of
using grep/read loops. One \`codegraph_explore\` call returns verbatim source,
call graphs, and blast-radius — no file reads needed.

If the MCP tool is unavailable, fall back to: \`codegraph explore "<query>"\` in Bash.
${CODEGRAPH_AGENTS_MARKER}`

/** Patch AGENTS.md with codegraph guidance for subagents (idempotent). */
export function patchAgentsMd(projectDir: string): void {
  const agentsPath = join(projectDir, "AGENTS.md")
  const existing   = existsSync(agentsPath) ? readFileSync(agentsPath, "utf8") : ""
  if (existing.includes(CODEGRAPH_AGENTS_MARKER)) return  // already patched
  const updated = existing
    ? `${existing.trimEnd()}\n\n${CODEGRAPH_AGENTS_BLOCK}\n`
    : `${CODEGRAPH_AGENTS_BLOCK}\n`
  try { writeFileSync(agentsPath, updated, "utf8") } catch { /* read-only — skip */ }
}

/** Run codegraph init in project dir (builds the code graph index). */
export function initCodegraph(projectDir: string): boolean {
  if (!commandExists("codegraph")) return false
  if (existsSync(join(projectDir, ".codegraph"))) return true  // already indexed
  try {
    spawnSync("codegraph", ["init", projectDir], { stdio: "pipe", timeout: 300_000 })
    return existsSync(join(projectDir, ".codegraph"))
  } catch {
    return false
  }
}

/** Bağımsız binary durumu — animasyon için */
export function checkStaticDeps(): Array<{ name: string; note: string; ok: boolean }> {
  const npxOk = commandExists("npx") || commandExists("bunx")
  const uvxOk = commandExists("uvx") || commandExists("uv")
  return [
    { name: "filesystem", note: npxOk ? "auto via npx"  : "needs Node/npm",   ok: npxOk },
    { name: "git",        note: uvxOk ? "auto via uvx"  : "needs uv (above)", ok: uvxOk },
    { name: "fetch",      note: uvxOk ? "auto via uvx"  : "needs uv (above)", ok: uvxOk },
  ]
}

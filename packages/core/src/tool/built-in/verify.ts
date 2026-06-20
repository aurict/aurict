import { z } from "zod"
import { spawn } from "bun"
import { resolve } from "node:path"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { findRelatedTests } from "../../verification/detector.js"
import { runRelatedTests, detectFramework } from "../../verification/runner.js"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

const ACTION_TIMEOUT: Record<string, number> = {
  typecheck: 10_000,
  test:      30_000,
  lint:      10_000,
  security:  20_000,
  deps:      10_000,
}

// ── Lint framework tespiti ────────────────────────────────────────────────────

function detectLinter(workdir: string): string[] | null {
  const pkg = (() => {
    try {
      return JSON.parse(require("fs").readFileSync(join(workdir, "package.json"), "utf8")) as Record<string, unknown>
    } catch { return null }
  })()

  const hasDepFn = (name: string): boolean => {
    if (!pkg) return false
    const all = [
      ...Object.keys((pkg["dependencies"]   as Record<string,unknown> | undefined) ?? {}),
      ...Object.keys((pkg["devDependencies"] as Record<string,unknown> | undefined) ?? {}),
    ]
    return all.includes(name)
  }

  if (existsSync(join(workdir, "biome.json")) || hasDepFn("@biomejs/biome"))
    return ["bunx", "biome", "check", "--reporter=json", "."]

  if (existsSync(join(workdir, ".eslintrc.js"))
    || existsSync(join(workdir, ".eslintrc.cjs"))
    || existsSync(join(workdir, ".eslintrc.json"))
    || existsSync(join(workdir, "eslint.config.js"))
    || existsSync(join(workdir, "eslint.config.ts"))
    || hasDepFn("eslint"))
    return ["bunx", "eslint", "--max-warnings=0", "."]

  if (existsSync(join(workdir, ".ruff.toml")) || existsSync(join(workdir, "ruff.toml")))
    return ["ruff", "check", "."]

  if (existsSync(join(workdir, "Cargo.toml")))
    return ["cargo", "clippy", "--", "-D", "warnings"]

  return null
}

// ── Security audit tespiti ────────────────────────────────────────────────────

function detectSecurityTool(workdir: string): string[] | null {
  if (existsSync(join(workdir, "package.json")))
    return ["bun", "audit"]
  if (existsSync(join(workdir, "Cargo.toml")))
    return ["cargo", "audit"]
  if (existsSync(join(workdir, "requirements.txt")) || existsSync(join(workdir, "pyproject.toml")))
    return ["pip-audit"]
  return null
}

// ── Dep check ─────────────────────────────────────────────────────────────────

function detectDepCheck(workdir: string): string[] | null {
  if (existsSync(join(workdir, "package.json")))
    return ["bunx", "depcheck", "--json"]
  return null
}

// ── Spawn helper ──────────────────────────────────────────────────────────────

async function runCmd(
  cmd:      string[],
  workdir:  string,
  timeoutMs: number,
  signal:   AbortSignal,
): Promise<{ output: string; exitCode: number }> {
  const proc  = spawn(cmd, { cwd: workdir, stdout: "pipe", stderr: "pipe" })
  const onAbort = () => { try { proc.kill() } catch { /* ok */ } }
  if (signal.aborted) { onAbort(); return { output: "aborted", exitCode: -1 } }
  signal.addEventListener("abort", onAbort, { once: true })
  const timer = setTimeout(onAbort, timeoutMs)

  const [out, err, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])
  clearTimeout(timer)
  signal.removeEventListener("abort", onAbort)

  const raw = (out + err).trim()
  return { output: raw.slice(0, 6_000) + (raw.length > 6_000 ? "\n[truncated]" : ""), exitCode: exitCode ?? -1 }
}

// ── Tool tanımı ───────────────────────────────────────────────────────────────

export const verifyTool: ToolDef = {
  id: "verify",
  description:
    "Run project verification checks after editing code.\n\n" +
    "Actions:\n" +
    "- typecheck: Run TypeScript compiler (tsc --noEmit)\n" +
    "- test:      Run related tests for the changed file (auto-detected framework)\n" +
    "- lint:      Run linter (biome, eslint, ruff, clippy — auto-detected)\n" +
    "- security:  Run dependency security audit (npm audit, cargo audit, pip-audit)\n" +
    "- deps:      Check for unused/missing dependencies\n\n" +
    "Use after writing or editing code. A task is NOT done until verify passes.",

  parameters: z.object({
    action: z.enum(["typecheck", "test", "lint", "security", "deps"])
              .describe("Which check to run"),
    path: z.string().optional()
            .describe("File path (for 'test': finds related test files; for 'typecheck': scopes error output)"),
  }),

  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const action  = String(args["action"])
    const rawPath = args["path"] ? String(args["path"]) : undefined
    const absPath = rawPath ? resolve(ctx.workdir, rawPath) : undefined
    const timeout = ACTION_TIMEOUT[action] ?? 15_000

    // ── typecheck ──────────────────────────────────────────────────────────────
    if (action === "typecheck") {
      const hasTsConfig = existsSync(join(ctx.workdir, "tsconfig.json"))
      if (!hasTsConfig) {
        return { output: "[typecheck] No tsconfig.json found in project root — skipping." }
      }
      try {
        const { output, exitCode } = await runCmd(
          ["bunx", "tsc", "--noEmit", "--pretty", "false"],
          ctx.workdir, timeout, ctx.signal,
        )
        if (exitCode === 0) return { output: "[typecheck] ✓ No TypeScript errors." }

        // Sadece belirtilen dosyaya ait satırları filtrele
        if (absPath) {
          const name    = absPath.split("/").pop() ?? ""
          const relevant = output.split("\n").filter(l => l.includes(name)).slice(0, 20)
          if (relevant.length > 0) {
            return { output: `[typecheck] Errors in ${name}:\n${relevant.join("\n")}` }
          }
        }
        return { output: `[typecheck] Errors found:\n${output}` }
      } catch (e) {
        return { output: "", error: `[typecheck] Failed to run tsc: ${e instanceof Error ? e.message : String(e)}` }
      }
    }

    // ── test ──────────────────────────────────────────────────────────────────
    if (action === "test") {
      const framework = detectFramework(ctx.workdir)
      if (!framework) {
        return { output: "[test] No test framework detected. Checked: bun, vitest, jest, pytest, go, cargo, dotnet." }
      }

      let testFiles: string[] = []
      let suiteNote = ""
      if (absPath) {
        testFiles = await findRelatedTests(absPath, ctx.workdir, ctx.signal)
        if (testFiles.length === 0) {
          suiteNote = " (no related tests found — running full suite)"
        }
      } else {
        suiteNote = " (no path provided — running full suite)"
      }

      const result = await runRelatedTests(testFiles, ctx.workdir, ctx.signal)
      const cacheNote = result.cached ? " (cached)" : ""
      const icon      = result.passed ? "✓" : "✗"

      return {
        output: `[test:${result.framework}${cacheNote}${suiteNote}] ${icon}\n${result.output}`,
        ...(result.passed ? {} : { error: "Tests failed — fix before declaring done." }),
      }
    }

    // ── lint ──────────────────────────────────────────────────────────────────
    if (action === "lint") {
      const cmd = detectLinter(ctx.workdir)
      if (!cmd) {
        return { output: "[lint] No linter detected. Checked: biome, eslint, ruff, clippy." }
      }
      const { output, exitCode } = await runCmd(cmd, ctx.workdir, timeout, ctx.signal)
      if (exitCode === 0) return { output: `[lint:${cmd[0]}] ✓ No issues.` }
      return {
        output: `[lint:${cmd[0]}] Issues found:\n${output}`,
        error:  "Lint errors found.",
      }
    }

    // ── security ──────────────────────────────────────────────────────────────
    if (action === "security") {
      const cmd = detectSecurityTool(ctx.workdir)
      if (!cmd) {
        return { output: "[security] No security audit tool detected. Checked: bun audit, cargo audit, pip-audit." }
      }
      const { output, exitCode } = await runCmd(cmd, ctx.workdir, timeout, ctx.signal)
      if (exitCode === 0) return { output: `[security:${cmd[0]}] ✓ No vulnerabilities found.` }
      return { output: `[security:${cmd[0]}] Vulnerabilities found:\n${output}` }
    }

    // ── deps ──────────────────────────────────────────────────────────────────
    if (action === "deps") {
      const cmd = detectDepCheck(ctx.workdir)
      if (!cmd) {
        return { output: "[deps] Dependency check only supported for Node.js projects (package.json required)." }
      }
      const { output, exitCode } = await runCmd(cmd, ctx.workdir, timeout, ctx.signal)
      if (exitCode === 0) {
        try {
          const parsed = JSON.parse(output) as { unused?: string[]; missing?: Record<string, unknown> }
          const unused  = parsed.unused  ?? []
          const missing = Object.keys(parsed.missing ?? {})
          if (unused.length === 0 && missing.length === 0) {
            return { output: "[deps] ✓ No unused or missing dependencies." }
          }
          const lines: string[] = ["[deps] Issues found:"]
          if (unused.length)  lines.push(`  Unused:  ${unused.join(", ")}`)
          if (missing.length) lines.push(`  Missing: ${missing.join(", ")}`)
          return { output: lines.join("\n") }
        } catch {
          return { output: `[deps]\n${output}` }
        }
      }
      return { output: `[deps]\n${output}` }
    }

    return { output: "", error: `Unknown action: ${action}` }
  },
}

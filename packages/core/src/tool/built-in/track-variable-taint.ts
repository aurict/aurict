import { z } from "zod"
import { execSync, spawnSync } from "node:child_process"
import { platform } from "node:os"
import { writeFileSync, unlinkSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

interface TaintFinding {
  rule_id:  string
  severity: string
  message:  string
  file:     string
  line:     number
  code:     string
  flow?:    string[]
}

interface TaintResult {
  os:              string
  backend:         "semgrep" | "grep_fallback"
  source?:         string
  sink?:           string
  findings:        TaintFinding[]
  finding_count:   number
  backend_version?: string
  install_hint?:   string
}

function semgrepVersion(): string | null {
  try {
    const r = spawnSync("semgrep", ["--version"], { encoding: "utf8", timeout: 5000 })
    if (r.status === 0) return r.stdout.trim()
    return null
  } catch { return null }
}

function buildTaintRule(filePath: string, source: string, sink: string, lang: string): string {
  // Determine semgrep language identifier
  const langMap: Record<string, string> = {
    js: "javascript", ts: "typescript", jsx: "javascript",
    tsx: "typescript", py: "python", rb: "ruby",
    java: "java", go: "go", php: "php",
  }
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "javascript"
  const semgrepLang = lang || langMap[ext] || "javascript"

  return JSON.stringify({
    rules: [{
      id: "aurict-taint-custom",
      mode: "taint",
      languages: [semgrepLang],
      severity: "ERROR",
      message: `Taint flow: ${source} → ${sink}`,
      "pattern-sources": [{ pattern: source }],
      "pattern-sinks":   [{ pattern: sink }],
    }],
  })
}

function runSemgrep(filePath: string, source?: string, sink?: string, lang?: string): TaintFinding[] {
  let configArg: string

  if (source && sink) {
    // Write custom taint rule to temp file
    const rulePath = join(tmpdir(), `aurict-taint-${Date.now()}.json`)
    writeFileSync(rulePath, buildTaintRule(filePath, source, sink, lang ?? ""))
    configArg = rulePath
    try {
      const r = spawnSync(
        "semgrep",
        ["--config", configArg, "--json", "--no-autofix", filePath],
        { encoding: "utf8", timeout: 30_000 },
      )
      unlinkSync(rulePath)
      if (r.status === 0 || r.stdout) {
        return parseSemgrepOutput(r.stdout)
      }
    } catch { unlinkSync(rulePath) }
    return []
  }

  // Default security scan
  const r = spawnSync(
    "semgrep",
    ["--config", "p/default", "--json", "--no-autofix", filePath],
    { encoding: "utf8", timeout: 60_000 },
  )
  if (r.status === 0 || r.stdout) return parseSemgrepOutput(r.stdout)
  return []
}

function parseSemgrepOutput(raw: string): TaintFinding[] {
  try {
    const parsed = JSON.parse(raw)
    const results = parsed?.results ?? []
    return results.map((r: Record<string, unknown>) => {
      const extra  = r["extra"] as Record<string, unknown> | undefined
      const start  = (r["start"] as Record<string, number> | undefined)
      const lines  = extra?.["lines"] as string | undefined
      return {
        rule_id:  String(r["check_id"] ?? "unknown"),
        severity: String(extra?.["severity"] ?? "unknown"),
        message:  String(extra?.["message"] ?? ""),
        file:     String(r["path"] ?? ""),
        line:     start?.["line"] ?? 0,
        code:     String(lines ?? ""),
      }
    })
  } catch { return [] }
}

function grepFallback(filePath: string, source: string, sink: string): TaintFinding[] {
  const findings: TaintFinding[] = []
  try {
    const content = require("node:fs").readFileSync(filePath, "utf8")
    const lines   = content.split("\n")

    const sourceLines: number[] = []
    const sinkLines:   number[] = []

    lines.forEach((line: string, i: number) => {
      if (line.includes(source)) sourceLines.push(i + 1)
      if (line.includes(sink))   sinkLines.push(i + 1)
    })

    if (sourceLines.length > 0 && sinkLines.length > 0) {
      findings.push({
        rule_id:  "grep-taint-fallback",
        severity: "WARNING",
        message:  `Source "${source}" (line ${sourceLines.join(",")}) and sink "${sink}" (line ${sinkLines.join(",")}) found in same file — manual review required`,
        file:     filePath,
        line:     sourceLines[0]!,
        code:     lines[sourceLines[0]! - 1] ?? "",
        flow:     [
          `Source at line ${sourceLines.join(", ")}`,
          `Sink at line ${sinkLines.join(", ")}`,
        ],
      })
    }
  } catch { /* unreadable */ }
  return findings
}

export const trackVariableTaintTool: ToolDef = {
  id:        "track_variable_taint",
  timeoutMs: 90_000,
  description: `Analyze taint flow from a source (user input) to a sink (dangerous function) in source code.
Detects SQL injection, command injection, XSS, and other injection vulnerabilities by tracing
how untrusted data reaches dangerous functions — without reading the entire file.

Automatically uses Semgrep taint analysis when available; falls back to grep-based detection otherwise.
Works on Linux, macOS, and Windows.

Use when: verifying if user input reaches a dangerous function, reviewing for injection vulnerabilities,
auditing specific data flow paths.`,

  parameters: z.object({
    file_path: z.string().describe("Path to the file to analyze"),
    source:    z.string().optional().describe("Taint source pattern, e.g. 'req.query.id', 'request.GET[\"q\"]'"),
    sink:      z.string().optional().describe("Taint sink pattern, e.g. 'db.query(...)', 'exec(...)', 'eval(...)'"),
    language:  z.string().optional().describe("Language hint: javascript, python, java, go, ruby, php. Auto-detected from extension if omitted."),
  }),

  async execute(args, _ctx: ToolContext): Promise<ExecuteResult> {
    const filePath = String(args["file_path"] ?? "")
    const source   = args["source"]   ? String(args["source"])   : undefined
    const sink     = args["sink"]     ? String(args["sink"])     : undefined
    const language = args["language"] ? String(args["language"]) : undefined

    const os      = platform()  // 'linux' | 'darwin' | 'win32'
    const osLabel = os === "darwin" ? "macOS" : os === "win32" ? "Windows" : "Linux"

    const version = semgrepVersion()
    const result: TaintResult = {
      os:           osLabel,
      backend:      version ? "semgrep" : "grep_fallback",
      findings:     [],
      finding_count: 0,
    }

    if (version) {
      result.backend_version = version
      result.findings = runSemgrep(filePath, source, sink, language)
    } else {
      result.install_hint = os === "win32"
        ? "Install Semgrep: pip install semgrep (requires Python 3.9+)"
        : os === "darwin"
          ? "Install Semgrep: brew install semgrep  OR  pip install semgrep"
          : "Install Semgrep: pip install semgrep  OR  snap install semgrep"

      if (source && sink) {
        result.findings = grepFallback(filePath, source, sink)
      } else {
        result.findings = []
        result.install_hint += " — grep fallback requires source and sink parameters"
      }
    }

    if (source) result.source = source
    if (sink)   result.sink   = sink
    result.finding_count = result.findings.length

    return { output: JSON.stringify(result, null, 2) }
  },
}

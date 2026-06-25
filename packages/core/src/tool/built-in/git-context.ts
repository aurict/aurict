import { z } from "zod"
import { execSync } from "child_process"
import { readFileSync } from "fs"
import { resolve, relative } from "path"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

// ── Types ─────────────────────────────────────────────────────────────────────

interface CommitInfo {
  hash:         string
  relativeTime: string
  subject:      string
  body:         string
  isRevert:     boolean
  isFix:        boolean
  refs:         string[]
}

interface Annotation {
  line: number
  kind: string
  text: string
}

interface FileCtx {
  relFile:      string
  commits:      CommitInfo[]
  annotations:  Annotation[]
  testFiles:    string[]
  tracked:      boolean
}

// ── Git helper ────────────────────────────────────────────────────────────────

function git(workdir: string, args: string): string {
  try {
    return execSync(`git -C "${workdir}" ${args}`, {
      encoding:  "utf8",
      stdio:     ["pipe", "pipe", "pipe"],
      maxBuffer: 4 * 1024 * 1024,
    }).trim()
  } catch {
    return ""
  }
}

function isGitRepo(workdir: string): boolean {
  return git(workdir, "rev-parse --is-inside-work-tree") === "true"
}

// ── Commit parser ─────────────────────────────────────────────────────────────

const SEP = "\x1F"

function getCommits(
  workdir: string,
  absFile: string,
  since:   string,
  max:     number,
): CommitInfo[] {
  const fmt = `%H${SEP}%ar${SEP}%s${SEP}%b`
  const raw = git(workdir, `log --follow --format="${fmt}${SEP}---END---" --since="${since}" -n ${max} -- "${absFile}"`)
  if (!raw) return []

  return raw
    .split(`${SEP}---END---`)
    .map(s => s.trim())
    .filter(Boolean)
    .map(block => {
      const parts = block.split(SEP)
      const hash         = (parts[0] ?? "").trim()
      const relativeTime = (parts[1] ?? "").trim()
      const subject      = (parts[2] ?? "").trim()
      const body         = (parts.slice(3) ?? []).join(" ").trim()

      if (!hash) return null

      const refMatches = [...subject.matchAll(/#(\d+)/g), ...body.matchAll(/#(\d+)/g)]
      const refs = [...new Set(refMatches.map(m => `#${m[1]}`))]

      return {
        hash,
        relativeTime,
        subject,
        body,
        isRevert: /^revert/i.test(subject),
        isFix:    /^fix[\(:]/i.test(subject),
        refs,
      }
    })
    .filter((c): c is CommitInfo => c !== null)
}

// ── Annotation extractor ──────────────────────────────────────────────────────

const ANNOTATION_RE = /(?:\/\/|#|--|\/\*)\s*(TODO|FIXME|HACK|NOTE|XXX|WARNING|WORKAROUND)[:\s]+(.*)/i

function extractAnnotations(absFile: string): Annotation[] {
  let content: string
  try { content = readFileSync(absFile, "utf8") } catch { return [] }

  return content
    .split("\n")
    .flatMap((line, i) => {
      const m = ANNOTATION_RE.exec(line)
      if (!m) return []
      return [{ line: i + 1, kind: m[1]!.toUpperCase(), text: (m[2] ?? "").trim() }]
    })
}

// ── Test file finder ──────────────────────────────────────────────────────────

function findTestFiles(workdir: string, absFile: string): string[] {
  const base = absFile.replace(/\.(tsx?)$/, "").split("/").pop() ?? ""
  if (!base) return []

  const tracked = git(workdir, "ls-files")
  if (!tracked) return []

  return tracked
    .split("\n")
    .filter(f => /\.(test|spec)\.(ts|tsx)$/.test(f) || /[/\\]__(tests?|specs?)__[/\\]/.test(f))
    .filter(f => {
      try { return readFileSync(resolve(workdir, f), "utf8").includes(base) }
      catch { return false }
    })
    .slice(0, 5)
}

// ── Pattern analysis ──────────────────────────────────────────────────────────

interface Patterns {
  revertCount:      number
  fixCount:         number
  recentCount:      number   // last 30 days
  allRefs:          string[]
  isBugProne:       boolean
  isUnstable:       boolean
  isActivelyEdited: boolean
}

function analyzePatterns(commits: CommitInfo[]): Patterns {
  const revertCount  = commits.filter(c => c.isRevert).length
  const fixCount     = commits.filter(c => c.isFix).length
  const recentCount  = commits.filter(c =>
    /minute|hour|day|week/.test(c.relativeTime) &&
    !/month|year/.test(c.relativeTime)
  ).length
  const allRefs = [...new Set(commits.flatMap(c => c.refs))]

  return {
    revertCount,
    fixCount,
    recentCount,
    allRefs,
    isBugProne:       fixCount >= 3 && (fixCount / Math.max(commits.length, 1)) > 0.4,
    isUnstable:       revertCount >= 2,
    isActivelyEdited: recentCount >= 3,
  }
}

// ── ANSI ──────────────────────────────────────────────────────────────────────

const C = {
  reset:   "\x1b[0m",
  bold:    "\x1b[1m",
  dim:     "\x1b[2m",
  cyan:    "\x1b[36m",
  green:   "\x1b[32m",
  yellow:  "\x1b[33m",
  blue:    "\x1b[34m",
  red:     "\x1b[31m",
  magenta: "\x1b[35m",
  gray:    "\x1b[90m",
}

// ── Formatter ─────────────────────────────────────────────────────────────────

function formatFileCtx(ctx: FileCtx): string {
  const lines: string[] = []

  lines.push("")
  lines.push(
    `${C.bold}${C.cyan}git_context${C.reset}  ` +
    `${C.bold}${ctx.relFile}${C.reset}`
  )
  lines.push(`${C.gray}${"─".repeat(60)}${C.reset}`)

  // ── No git / not tracked ──────────────────────────────────────────────
  if (!ctx.tracked) {
    lines.push("")
    lines.push(`${C.gray}Not tracked by git — no history available.${C.reset}`)
    lines.push(`${C.dim}(New file or outside repository)${C.reset}`)
  } else if (ctx.commits.length === 0) {
    lines.push("")
    lines.push(`${C.gray}No commits in the requested time range.${C.reset}`)
    lines.push(`${C.dim}New file, or all changes predated the lookback window.${C.reset}`)
  } else {
    const p = analyzePatterns(ctx.commits)

    // ── Warnings ──────────────────────────────────────────────────────
    lines.push("")
    if (p.isUnstable) {
      lines.push(
        `${C.bold}${C.red}⚠ Unstable area${C.reset}  ` +
        `${C.red}reverted ${p.revertCount}×${C.reset}`
      )
    }
    if (p.isBugProne) {
      lines.push(
        `${C.bold}${C.yellow}⚠ Bug-prone${C.reset}  ` +
        `${C.yellow}${p.fixCount} of ${ctx.commits.length} commits are fixes${C.reset}`
      )
    }
    if (p.isActivelyEdited) {
      lines.push(
        `${C.green}↺ Active development${C.reset}  ` +
        `${C.green}${p.recentCount} recent commits${C.reset}`
      )
    }
    if (!p.isUnstable && !p.isBugProne && !p.isActivelyEdited) {
      lines.push(`${C.green}✓ Stable${C.reset}`)
    }

    // ── Commit list ───────────────────────────────────────────────────
    lines.push("")
    lines.push(`${C.bold}History:${C.reset} ${C.gray}${ctx.commits.length} commit${ctx.commits.length !== 1 ? "s" : ""}${C.reset}`)
    for (const c of ctx.commits.slice(0, 10)) {
      const badge = c.isRevert
        ? `${C.red}[revert]${C.reset} `
        : c.isFix
          ? `${C.yellow}[fix]${C.reset} `
          : ""
      const refs = c.refs.length ? `  ${C.blue}${c.refs.join(" ")}${C.reset}` : ""
      lines.push(
        `  ${C.gray}└─${C.reset} ${badge}${c.subject.slice(0, 68)}` +
        `${C.gray}  ${c.relativeTime}${C.reset}${refs}`
      )
    }
    if (ctx.commits.length > 10) {
      lines.push(`  ${C.gray}   … ${ctx.commits.length - 10} more${C.reset}`)
    }

    // ── Referenced issues ─────────────────────────────────────────────
    if (p.allRefs.length > 0) {
      lines.push("")
      lines.push(`${C.bold}Referenced issues:${C.reset}  ${p.allRefs.slice(0, 8).join("  ")}`)
    }
  }

  // ── Annotations ───────────────────────────────────────────────────────
  if (ctx.annotations.length > 0) {
    lines.push("")
    lines.push(`${C.bold}Annotations:${C.reset}`)
    for (const a of ctx.annotations) {
      const kindColor =
        a.kind === "FIXME" || a.kind === "HACK" || a.kind === "XXX" ? C.red :
        a.kind === "TODO"  || a.kind === "WARNING"                  ? C.yellow : C.gray
      lines.push(
        `  ${C.gray}└─${C.reset} ${C.gray}:${a.line}${C.reset}  ` +
        `${kindColor}${a.kind}${C.reset}  ${a.text.slice(0, 80)}`
      )
    }
  }

  // ── Tests ─────────────────────────────────────────────────────────────
  if (ctx.testFiles.length > 0) {
    lines.push("")
    lines.push(`${C.bold}Related tests:${C.reset}`)
    for (const t of ctx.testFiles) {
      lines.push(`  ${C.gray}└─${C.reset} ${C.blue}${t}${C.reset}`)
    }
  }

  lines.push("")
  return lines.join("\n")
}

// ── Tool ──────────────────────────────────────────────────────────────────────

export const gitContextTool: ToolDef = {
  id: "git_context",

  spec: { category: "read", riskLevel: "low" },

  description: `Surfaces WHY code exists before you modify it.

Pulls together: revert history (unstable areas), fix-commit density (bug-prone areas),
referenced issues, code annotations (TODO/FIXME/HACK), and related test files.

USE THIS before modifying files in an established project to understand past decisions,
known problem areas, and intentional workarounds you shouldn't accidentally remove.

Most valuable on files with meaningful git history (10+ commits). On new files or new
projects the output will clearly state "no history" — the annotation extraction still
works regardless.

EXAMPLE:
  { files: ["packages/core/src/agent/runner.ts", "packages/cli/src/tui/App.tsx"] }
  { files: ["src/auth/middleware.ts"], since: "1 year ago" }`,

  parameters: z.object({
    files: z.array(z.string()).min(1).max(8)
      .describe("Files you are about to modify (relative or absolute paths)"),
    since: z.string().optional().default("6 months ago")
      .describe("How far back to look. Examples: '3 months ago', '1 year ago', '2024-01-01'"),
  }),

  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const files = (args["files"] as string[])
    const since = String(args["since"] ?? "6 months ago")

    if (!isGitRepo(ctx.workdir)) {
      // Not a git repo — still extract annotations
      const parts: string[] = []
      for (const f of files) {
        const absFile = resolve(ctx.workdir, f)
        const relFile = relative(ctx.workdir, absFile)
        const annotations = extractAnnotations(absFile)

        const lines: string[] = [
          "",
          `${C.bold}${C.cyan}git_context${C.reset}  ${C.bold}${relFile}${C.reset}`,
          `${C.gray}${"─".repeat(60)}${C.reset}`,
          "",
          `${C.gray}Not a git repository — history unavailable.${C.reset}`,
        ]
        if (annotations.length > 0) {
          lines.push("", `${C.bold}Annotations:${C.reset}`)
          for (const a of annotations) {
            const kindColor = a.kind === "FIXME" || a.kind === "HACK" ? C.red : C.yellow
            lines.push(`  ${C.gray}└─${C.reset} ${C.gray}:${a.line}${C.reset}  ${kindColor}${a.kind}${C.reset}  ${a.text.slice(0, 80)}`)
          }
        }
        lines.push("")
        parts.push(lines.join("\n"))
      }
      return { output: parts.join("") }
    }

    const results: string[] = []

    for (const f of files) {
      const absFile = resolve(ctx.workdir, f)
      const relFile = relative(ctx.workdir, absFile)

      // Non-empty output means the file is tracked
      const tracked = git(ctx.workdir, `ls-files "${absFile}"`) !== ""

      const commits     = getCommits(ctx.workdir, absFile, since, 20)
      const annotations = extractAnnotations(absFile)
      const testFiles   = findTestFiles(ctx.workdir, absFile)

      const fileCtx: FileCtx = { relFile, commits, annotations, testFiles, tracked }
      results.push(formatFileCtx(fileCtx))
    }

    return { output: results.join("") }
  },
}

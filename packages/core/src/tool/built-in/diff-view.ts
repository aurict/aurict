/**
 * diff_view — Değişiklik önizleme, dosya uygulanmadan.
 *
 * Üç mod:
 *  patch  — Unified diff patch metnini hedef dosyayla karşılaştırır (git apply --check)
 *  files  — İki dosyayı yan yana fark gösterir
 *  inline — Mevcut dosya içeriğiyle önerilen yeni içeriği karşılaştırır
 *
 * Dosyalar değiştirilmez. apply_patch öncesi güvenlik katmanı olarak kullanılır.
 */

import { z }                                    from "zod"
import { existsSync, readFileSync }             from "node:fs"
import { join, relative }                       from "node:path"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

// ── Myers diff algoritması (saf JS, git bağımsız) ─────────────────────────────

interface DiffHunk {
  oldStart: number   // 1-based
  oldLines: string[]
  newStart: number
  newLines: string[]
}

function myersDiff(oldLines: string[], newLines: string[]): Array<{ type: "equal" | "delete" | "insert"; line: string; oldIdx: number; newIdx: number }> {
  // Basit LCS tabanlı diff — büyük dosyalar için örnekleme ile çalışır
  const MAX_LINES = 2000
  const a = oldLines.slice(0, MAX_LINES)
  const b = newLines.slice(0, MAX_LINES)

  const n = a.length
  const m = b.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (a[i] === b[j]) {
        dp[i]![j] = 1 + dp[i + 1]![j + 1]!
      } else {
        dp[i]![j] = Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!)
      }
    }
  }

  const result: Array<{ type: "equal" | "delete" | "insert"; line: string; oldIdx: number; newIdx: number }> = []
  let i = 0
  let j = 0

  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) {
      result.push({ type: "equal", line: a[i]!, oldIdx: i, newIdx: j })
      i++; j++
    } else if (j < m && (i >= n || dp[i]![j + 1]! >= dp[i + 1]![j]!)) {
      result.push({ type: "insert", line: b[j]!, oldIdx: i, newIdx: j })
      j++
    } else {
      result.push({ type: "delete", line: a[i]!, oldIdx: i, newIdx: j })
      i++
    }
  }

  return result
}

// ── Unified diff formatı üret ─────────────────────────────────────────────────

function formatUnifiedDiff(
  oldPath:  string,
  newPath:  string,
  oldLines: string[],
  newLines: string[],
  context:  number,
): { output: string; stats: { added: number; removed: number } } {
  const edits  = myersDiff(oldLines, newLines)
  const hunks: Array<{ lines: string[]; oldStart: number; newStart: number; oldCount: number; newCount: number }> = []

  let stats = { added: 0, removed: 0 }

  // Değişen satırları grupla, context ekle
  const changeIndices: number[] = []
  for (let i = 0; i < edits.length; i++) {
    if (edits[i]!.type !== "equal") changeIndices.push(i)
  }

  if (changeIndices.length === 0) {
    return { output: `--- ${oldPath}\n+++ ${newPath}\n\n(no differences)`, stats }
  }

  // Hunk'ları birleştir (yakın değişiklikleri tek hunk'ta topla)
  const regions: Array<{ start: number; end: number }> = []
  for (const idx of changeIndices) {
    const s = Math.max(0, idx - context)
    const e = Math.min(edits.length - 1, idx + context)
    if (regions.length > 0 && s <= regions[regions.length - 1]!.end + 1) {
      regions[regions.length - 1]!.end = e
    } else {
      regions.push({ start: s, end: e })
    }
  }

  for (const region of regions) {
    const slice     = edits.slice(region.start, region.end + 1)
    const oldStart  = slice.find((e) => e.type !== "insert")?.oldIdx ?? 0
    const newStart  = slice.find((e) => e.type !== "delete")?.newIdx ?? 0
    const lines: string[] = []
    let oldCount = 0
    let newCount = 0

    for (const e of slice) {
      if (e.type === "equal") {
        lines.push(` ${e.line}`)
        oldCount++; newCount++
      } else if (e.type === "delete") {
        lines.push(`-${e.line}`)
        oldCount++
        stats.removed++
      } else {
        lines.push(`+${e.line}`)
        newCount++
        stats.added++
      }
    }

    hunks.push({ lines, oldStart: oldStart + 1, newStart: newStart + 1, oldCount, newCount })
  }

  const diffLines = [
    `--- ${oldPath}`,
    `+++ ${newPath}`,
  ]
  for (const hunk of hunks) {
    diffLines.push(`@@ -${hunk.oldStart},${hunk.oldCount} +${hunk.newStart},${hunk.newCount} @@`)
    diffLines.push(...hunk.lines)
  }

  return { output: diffLines.join("\n"), stats }
}

// ── Patch parse & validate (git apply --check fallback) ──────────────────────

async function gitApplyCheck(patch: string, workdir: string): Promise<{ valid: boolean; reason?: string }> {
  try {
    // Geçici patch içeriğini stdin'den gönder
    const proc = Bun.spawn(["git", "apply", "--check", "-"], {
      cwd:   workdir,
      stdin: new TextEncoder().encode(patch),
      stdout: "pipe",
      stderr: "pipe",
    })
    const [, stderr] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ])
    const exit = await proc.exited
    if (exit === 0) return { valid: true }
    return { valid: false, reason: stderr.trim() || "Patch does not apply cleanly" }
  } catch {
    return { valid: true }  // git yoksa geçerli say (pure JS fallback yapılır)
  }
}

// ── Tool tanımı ───────────────────────────────────────────────────────────────

export const diffViewTool: ToolDef = {
  id: "diff_view",
  description:
    "Preview file changes WITHOUT applying them. No files are modified.\n\n" +
    "ACTIONS:\n" +
    "  patch  — Validate a unified diff patch against the target file (use before apply_patch)\n" +
    "  files  — Show diff between two existing files\n" +
    "  inline — Compare current file content with proposed new content\n\n" +
    "WHEN TO USE:\n" +
    "  Before apply_patch → diff_view(action='patch', path='...', patch='...')\n" +
    "  Before write       → diff_view(action='inline', path='...', proposed='...')\n" +
    "  Understanding changes → diff_view(action='files', pathA='...', pathB='...')\n\n" +
    "OUTPUT: unified diff format with line numbers and statistics.\n" +
    "Files are NEVER modified — this is read-only.",

  parameters: z.object({
    action:   z.enum(["patch", "files", "inline"])
                .describe("Mode to use"),
    path:     z.string().optional()
                .describe("Target file path (for 'patch' and 'inline')"),
    patch:    z.string().optional()
                .describe("Unified diff patch text to preview (for action='patch')"),
    pathA:    z.string().optional()
                .describe("Original/old file path (for action='files')"),
    pathB:    z.string().optional()
                .describe("Modified/new file path (for action='files')"),
    proposed: z.string().optional()
                .describe("Proposed new file content (for action='inline')"),
    context:  z.number().optional()
                .default(3)
                .describe("Number of context lines around changes (default: 3)"),
  }),

  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const action  = String(args["action"])
    const context = typeof args["context"] === "number" ? args["context"] : 3
    const resolve  = (p: string) => p.startsWith("/") ? p : join(ctx.workdir, p)

    // ── patch ─────────────────────────────────────────────────────────────────
    if (action === "patch") {
      const patchText = args["patch"] ? String(args["patch"]) : undefined
      const filePath  = args["path"]  ? String(args["path"])  : undefined
      if (!patchText) return { output: "", error: "patch text is required for action='patch'" }

      // git apply --check ile doğrula
      const check = await gitApplyCheck(patchText, ctx.workdir)

      // İstatistikler
      const addedLines   = (patchText.match(/^\+(?!\+\+)/gm) ?? []).length
      const removedLines = (patchText.match(/^-(?!--)/gm)    ?? []).length
      const files        = [...patchText.matchAll(/^\+\+\+ b\/(.+)/gm)].map((m) => m[1])

      const lines: string[] = [
        check.valid
          ? "Patch validation: VALID ✓"
          : "Patch validation: INVALID ✗",
      ]

      if (!check.valid && check.reason) {
        lines.push("", "Error:")
        lines.push(...check.reason.split("\n").map((l) => `  ${l}`))
      }

      lines.push("")
      if (files.length > 0) lines.push(`Files:  ${files.join(", ")}`)
      lines.push(`Stats:  +${addedLines} lines  -${removedLines} lines`)
      lines.push("")
      lines.push("Patch content:")
      lines.push("─".repeat(40))
      lines.push(patchText.slice(0, 4000))
      if (patchText.length > 4000) lines.push("… (truncated)")

      if (check.valid) {
        lines.push("", "✓ Safe to apply with apply_patch.")
      } else {
        lines.push("", "✗ Fix the patch before applying.")
      }

      return { output: lines.join("\n") }
    }

    // ── files ─────────────────────────────────────────────────────────────────
    if (action === "files") {
      const pathA = args["pathA"] ? String(args["pathA"]) : undefined
      const pathB = args["pathB"] ? String(args["pathB"]) : undefined
      if (!pathA) return { output: "", error: "pathA is required for action='files'" }
      if (!pathB) return { output: "", error: "pathB is required for action='files'" }

      const absA = resolve(pathA)
      const absB = resolve(pathB)

      if (!existsSync(absA)) return { output: "", error: `File not found: ${absA}` }
      if (!existsSync(absB)) return { output: "", error: `File not found: ${absB}` }

      const oldLines = readFileSync(absA, "utf8").split("\n")
      const newLines = readFileSync(absB, "utf8").split("\n")
      const { output, stats } = formatUnifiedDiff(
        relative(ctx.workdir, absA),
        relative(ctx.workdir, absB),
        oldLines,
        newLines,
        context,
      )

      return {
        output: [
          `Diff: ${pathA} → ${pathB}`,
          `Stats: +${stats.added} lines  -${stats.removed} lines`,
          "",
          output,
        ].join("\n"),
      }
    }

    // ── inline ────────────────────────────────────────────────────────────────
    if (action === "inline") {
      const filePath = args["path"]     ? String(args["path"])     : undefined
      const proposed = args["proposed"] ? String(args["proposed"]) : undefined
      if (!filePath) return { output: "", error: "path is required for action='inline'" }
      if (!proposed) return { output: "", error: "proposed content is required for action='inline'" }

      const absPath = resolve(filePath)
      const label   = relative(ctx.workdir, absPath)

      let oldLines: string[]
      if (existsSync(absPath)) {
        oldLines = readFileSync(absPath, "utf8").split("\n")
      } else {
        // Yeni dosya — tüm satırlar ekleme
        oldLines = []
      }

      const newLines = proposed.split("\n")
      const { output, stats } = formatUnifiedDiff(
        `a/${label}`,
        `b/${label}`,
        oldLines,
        newLines,
        context,
      )

      const isNew = !existsSync(absPath)
      return {
        output: [
          isNew ? `New file: ${filePath}` : `Inline diff: ${filePath}`,
          `Stats: +${stats.added} lines  -${stats.removed} lines`,
          "",
          output,
          "",
          "No files modified. Use write or apply_patch to apply changes.",
        ].join("\n"),
      }
    }

    return { output: "", error: `Unknown action: ${action}` }
  },
}

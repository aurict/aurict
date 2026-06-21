/**
 * file_stat — Toplu dosya meta verisi, izin gerektirmez.
 *
 * Bir ya da birden fazla dosya için tek çağrıda:
 *  - Boyut (bytes + okunabilir format)
 *  - Son değişiklik tarihi (relative: "2 hours ago")
 *  - Satır sayısı (metin dosyaları, >10MB örnekleme)
 *  - İkili / metin tespiti
 *  - Git durumu (tracked/untracked, modified/staged/clean)
 *  - Glob pattern desteği (en fazla 50 dosya)
 *
 * Kullanım: 'ls -la', 'wc -l', 'git status <file>', 'stat <file>' yerine.
 */

import { z }                                         from "zod"
import { existsSync, statSync, readFileSync,
         readdirSync }                               from "node:fs"
import { join, relative, resolve as pathResolve }   from "node:path"
import type { ToolDef, ToolContext, ExecuteResult }  from "../types.js"

// ── Yardımcı: insan dostu boyut ──────────────────────────────────────────────

function humanSize(bytes: number): string {
  if (bytes < 1024)                      return `${bytes} B`
  if (bytes < 1024 * 1024)              return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024)      return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

// ── Yardımcı: relative zaman ─────────────────────────────────────────────────

function relativeTime(ms: number): string {
  const diff = Date.now() - ms
  const s    = Math.floor(diff / 1000)
  const m    = Math.floor(s / 60)
  const h    = Math.floor(m / 60)
  const d    = Math.floor(h / 24)

  if (s < 10)   return "just now"
  if (s < 60)   return `${s} seconds ago`
  if (m < 60)   return `${m} minute${m !== 1 ? "s" : ""} ago`
  if (h < 24)   return `${h} hour${h !== 1 ? "s" : ""} ago`
  if (d < 30)   return `${d} day${d !== 1 ? "s" : ""} ago`
  return new Date(ms).toISOString().slice(0, 10)
}

// ── Yardımcı: binary/metin tespiti ───────────────────────────────────────────

function isBinary(buffer: Buffer): boolean {
  // İlk 512 byte'ta null byte veya çok fazla non-printable char varsa binary
  const sample = buffer.slice(0, Math.min(512, buffer.length))
  let nonPrint = 0
  for (const byte of sample) {
    if (byte === 0) return true          // null byte → kesinlikle binary
    if (byte < 8 || (byte > 13 && byte < 32)) nonPrint++
  }
  return nonPrint / sample.length > 0.1  // >%10 non-printable → binary
}

// ── Yardımcı: satır sayısı ───────────────────────────────────────────────────

function countLines(path: string, sizeBytes: number): number | null {
  try {
    if (sizeBytes > 10 * 1024 * 1024) {
      // Büyük dosya: örnekleme (ilk + son 512KB'dan tahmin)
      const buf    = readFileSync(path)
      if (isBinary(buf)) return null
      const sample = buf.slice(0, 512 * 1024).toString("utf8")
      const ratio  = sample.split("\n").length / (512 * 1024)
      return Math.round(ratio * sizeBytes)
    }
    const buf = readFileSync(path)
    if (isBinary(buf)) return null
    return buf.toString("utf8").split("\n").length
  } catch {
    return null
  }
}

// ── Yardımcı: git status tek dosya için ──────────────────────────────────────

async function gitStatus(absPath: string, workdir: string): Promise<string> {
  try {
    const proc = Bun.spawn(
      ["git", "status", "--porcelain", "--", absPath],
      { cwd: workdir, stdout: "pipe", stderr: "pipe" }
    )
    const out  = (await new Response(proc.stdout).text()).trim()
    const exit = await proc.exited
    if (exit !== 0) return "untracked"

    if (!out) return "clean"
    const code = out.slice(0, 2)
    if (code[0] !== " " && code[0] !== "?") return "staged"
    if (code[1] === "M") return "modified (unstaged)"
    if (code[1] === "D") return "deleted"
    if (code === "??") return "untracked"
    return out.trim()
  } catch {
    return "unknown"
  }
}

// ── Yardımcı: glob genişletme (basit **/*.ext desteği) ───────────────────────

function expandGlob(pattern: string, workdir: string): string[] {
  // Basit glob: tek seviye wildcard (*) ve recursive (**) desteği
  const abs = pattern.startsWith("/") ? pattern : join(workdir, pattern)

  if (!pattern.includes("*")) {
    return existsSync(abs) ? [abs] : []
  }

  // ** içeriyorsa recursive
  const results: string[] = []
  const parts  = pattern.split("/")
  const root   = parts[0]?.startsWith("/") ? "/" : workdir

  function walk(dir: string, remaining: string[]): void {
    if (results.length >= 50) return
    if (remaining.length === 0) return

    const segment = remaining[0]!

    if (segment === "**") {
      // Recursive: bu klasör ve alt klasörler
      walk(dir, remaining.slice(1))
      try {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          if (entry.isDirectory() && !entry.name.startsWith(".")) {
            walk(join(dir, entry.name), remaining)
          }
        }
      } catch { /* ok */ }
      return
    }

    const isLast = remaining.length === 1
    const regex  = new RegExp("^" + segment.replace(/\./g, "\\.").replace(/\*/g, "[^/]*") + "$")

    try {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (!regex.test(entry.name)) continue
        const full = join(dir, entry.name)
        if (isLast && entry.isFile()) {
          results.push(full)
        } else if (!isLast && entry.isDirectory()) {
          walk(full, remaining.slice(1))
        }
      }
    } catch { /* ok */ }
  }

  const relParts = pattern.startsWith("/") ? pattern.slice(1).split("/") : pattern.split("/")
  walk(workdir, relParts)
  return results.slice(0, 50)
}

// ── Tool tanımı ───────────────────────────────────────────────────────────────

export const fileStatTool: ToolDef = {
  id: "file_stat",
  description:
    "Get metadata for one or multiple files — no shell, no permission prompt.\n\n" +
    "Returns for each file:\n" +
    "  - Size (bytes + human-readable)\n" +
    "  - Last modified (relative: '2 hours ago')\n" +
    "  - Line count (text files; estimated for files >10MB)\n" +
    "  - Binary or text detection\n" +
    "  - Git status: clean / modified / staged / untracked\n\n" +
    "ACCEPTS:\n" +
    "  - Absolute paths: '/home/user/proj/src/main.ts'\n" +
    "  - Relative paths: 'src/main.ts' (relative to workdir)\n" +
    "  - Glob patterns:  'src/**/*.ts' (max 50 files)\n\n" +
    "USE INSTEAD OF: 'ls -la', 'wc -l', 'git status <file>', 'stat <file>'\n" +
    "No permission required.",

  parameters: z.object({
    paths: z.array(z.string())
             .min(1)
             .max(50)
             .describe("File paths, relative paths, or glob patterns (max 50)"),
    git:   z.boolean()
             .optional()
             .default(true)
             .describe("Include git status (default: true; set false to skip for speed)"),
  }),

  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const rawPaths  = args["paths"] as string[]
    const showGit   = args["git"] !== false
    const lines: string[] = []

    // Glob genişletme — her pattern'ı dosya listesine çevir
    const resolved: string[] = []
    for (const raw of rawPaths) {
      const expanded = expandGlob(raw, ctx.workdir)
      if (expanded.length === 0) {
        // Glob değilse ve dosya yoksa hata
        const abs = raw.startsWith("/") ? raw : join(ctx.workdir, raw)
        if (!existsSync(abs)) {
          lines.push(`${raw}`)
          lines.push(`  ERROR: file not found`)
          lines.push("")
          continue
        }
        resolved.push(abs)
      } else {
        resolved.push(...expanded)
      }
    }

    if (resolved.length === 0 && lines.length === 0) {
      return { output: "(no files found)" }
    }

    // Çok fazla dosyaysa uyar
    if (resolved.length > 50) {
      lines.push(`WARNING: too many files (${resolved.length}), showing first 50.\n`)
    }

    // Her dosya için stat
    const toProcess = resolved.slice(0, 50)
    const gitStatuses = showGit
      ? await Promise.all(toProcess.map((p) => gitStatus(p, ctx.workdir)))
      : toProcess.map(() => "")

    for (let i = 0; i < toProcess.length; i++) {
      const absPath = toProcess[i]!
      const label   = relative(ctx.workdir, absPath)

      lines.push(label)

      try {
        const st         = statSync(absPath)
        const sizeBytes  = st.size
        const lineCount  = countLines(absPath, sizeBytes)
        const bin        = (() => {
          try {
            const buf = readFileSync(absPath, { flag: "r" })
            return isBinary(buf.slice(0, 512))
          } catch { return false }
        })()

        lines.push(`  size:     ${humanSize(sizeBytes)}${sizeBytes < 1024 ? "" : ` (${sizeBytes.toLocaleString()} bytes)`}`)
        if (lineCount !== null) {
          lines.push(`  lines:    ${lineCount.toLocaleString()}`)
        }
        lines.push(`  modified: ${relativeTime(st.mtimeMs)}`)
        lines.push(`  type:     ${bin ? "binary" : "text"}`)
        if (showGit) {
          lines.push(`  git:      ${gitStatuses[i] || "unknown"}`)
        }
      } catch (err) {
        lines.push(`  ERROR: ${err instanceof Error ? err.message : String(err)}`)
      }

      lines.push("")
    }

    if (toProcess.length > 1) {
      lines.push(`Total: ${toProcess.length} file${toProcess.length !== 1 ? "s" : ""}`)
    }

    return { output: lines.join("\n").trimEnd() }
  },
}

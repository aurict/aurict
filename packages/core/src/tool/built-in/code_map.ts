import { z } from "zod"
import { resolve, relative, join } from "path"
import { extractSymbols, formatSymbolsSummary, detectLanguage } from "../../analysis/symbols.js"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

const OVERALL_TIMEOUT_MS = 20_000   // tüm collectFiles + sembol çıkarımı için üst sınır
const FILE_TIMEOUT_MS    = 5_000    // tek dosya okuması için üst sınır

const SUPPORTED_EXTS = new Set([
  ".ts", ".tsx", ".mts", ".cts",
  ".js", ".jsx", ".mjs", ".cjs",
  ".py", ".rs", ".go",
  ".java", ".kt", ".kts",
  ".c", ".h", ".cpp", ".cc", ".hpp",
])

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "out", ".next", ".nuxt",
  "__pycache__", ".mypy_cache", "target", "vendor", ".venv", "venv",
  "coverage", ".coverage", ".tox",
])

export const codeMapTool: ToolDef = {
  id: "code_map",
  description: `Generate a structural map of a directory: every source file with its exported symbols.

Returns a compact representation showing what each file exports (functions, classes, types).
Much faster than reading files one by one. Use this to:
- Understand a project's structure at a glance
- Find which file defines a specific function or class
- Plan a refactor: see all touch points before editing
- Onboard to an unfamiliar codebase in one tool call

Output format per file:
  path/to/file.ts  function(foo, bar) | class(Baz) | type(MyType)`,

  parameters: z.object({
    dir:          z.string().optional().default(".")
      .describe("Directory to map (relative to workdir, default: current dir)"),
    pattern:      z.string().optional()
      .describe("Glob pattern to filter files, e.g. 'src/**/*.ts'"),
    max_files:    z.number().int().min(1).max(200).optional().default(80)
      .describe("Maximum number of files to include (default: 80)"),
    show_private: z.boolean().optional().default(false)
      .describe("Include non-exported symbols"),
  }),

  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const rawDir    = String(args["dir"] ?? ".")
    const maxFiles  = Number(args["max_files"] ?? 80)
    const showPri   = Boolean(args["show_private"])
    const pattern   = args["pattern"] as string | undefined

    const absDir = rawDir.startsWith("/") ? rawDir : resolve(ctx.workdir, rawDir)

    // İptal + genel timeout: parent signal veya OVERALL_TIMEOUT_MS dolduğunda
    // walk ve sembol çıkarımı erken durur (glob tool'undaki desenle tutarlı).
    const ac = new AbortController()
    const onParentAbort = () => ac.abort()
    ctx.signal.addEventListener("abort", onParentAbort, { once: true })
    let timedOut = false
    const timer = setTimeout(() => { timedOut = true; ac.abort() }, OVERALL_TIMEOUT_MS)

    try {
      // Collect files
      const files = await collectFiles(absDir, maxFiles, ac.signal, pattern)

      if (files.length === 0) {
        return { output: timedOut ? `Timed out collecting files in ${rawDir}` : `No source files found in ${rawDir}` }
      }

      // Extract symbols in parallel (batches of 10 to avoid FD exhaustion)
      const BATCH = 10
      const rows: Array<{ relPath: string; summary: string }> = []

      for (let i = 0; i < files.length; i += BATCH) {
        if (ac.signal.aborted) break
        const batch = files.slice(i, i + BATCH)
        // Tek bir dosya (FIFO/socket/yavaş FS) tüm batch'i sonsuza kadar
        // bekletmesin diye dosya başına timeout uygula.
        const results = await Promise.all(batch.map(f => withTimeout(f, extractSymbols(f))))
        for (const r of results) {
          const relPath = relative(ctx.workdir, r.path)
          const summary = r.error ? `[error: ${r.error}]` : formatSymbolsSummary(r, showPri)
          rows.push({ relPath, summary })
        }
      }

      // Build output
      const lines: string[] = [
        `Code map: ${rawDir}  (${files.length} file${files.length !== 1 ? "s" : ""})`,
        "",
      ]

      // Group by directory
      const byDir = new Map<string, typeof rows>()
      for (const row of rows) {
        const dir = row.relPath.includes("/")
          ? row.relPath.slice(0, row.relPath.lastIndexOf("/"))
          : "."
        if (!byDir.has(dir)) byDir.set(dir, [])
        byDir.get(dir)!.push(row)
      }

      for (const [dirName, dirRows] of [...byDir.entries()].sort()) {
        if (dirName !== ".") lines.push(`${dirName}/`)
        for (const row of dirRows) {
          const fileName = row.relPath.includes("/")
            ? row.relPath.slice(row.relPath.lastIndexOf("/") + 1)
            : row.relPath
          const prefix = dirName !== "." ? "  " : ""
          const sym    = row.summary ? `  → ${row.summary}` : ""
          lines.push(`${prefix}${fileName}${sym}`)
        }
        lines.push("")
      }

      if (files.length === maxFiles) {
        lines.push(`[Truncated at ${maxFiles} files. Use 'pattern' or 'dir' to narrow scope.]`)
      }
      if (timedOut) {
        lines.push(`[Timed out after ${OVERALL_TIMEOUT_MS / 1000}s — partial results.]`)
      } else if (ctx.signal.aborted) {
        lines.push(`[Cancelled — partial results.]`)
      }

      return { output: lines.join("\n").trimEnd() }
    } finally {
      clearTimeout(timer)
      ctx.signal.removeEventListener("abort", onParentAbort)
    }
  },
}

/** extractSymbols'ı dosya başına timeout ile sarar; asılı kalan okumayı keser. */
async function withTimeout(
  path:    string,
  promise: Promise<Awaited<ReturnType<typeof extractSymbols>>>,
): Promise<Awaited<ReturnType<typeof extractSymbols>>> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<Awaited<ReturnType<typeof extractSymbols>>>(resolve => {
    timer = setTimeout(() => resolve({
      path, language: detectLanguage(path), symbols: [], error: "timeout (>5s)",
    }), FILE_TIMEOUT_MS)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

async function collectFiles(
  dir:      string,
  limit:    number,
  signal:   AbortSignal,
  pattern?: string,
): Promise<string[]> {
  const files: string[] = []

  if (pattern) {
    // Bun.Glob.scan AbortSignal almadığı için iptal-güvenli walk kullan;
    // glob pattern'i itiasyon sonrası filtre olarak uygula.
    const globMatcher = new Bun.Glob(pattern)
    const all: string[] = []
    await walk(dir, all, limit * 4, 0, signal)  // daha geniş tara, sonra filtrele
    for (const f of all) {
      if (signal.aborted) break
      const rel  = relative(dir, f)
      const lang = detectLanguage(f)
      if (lang !== "unknown" && globMatcher.match(rel)) files.push(f)
      if (files.length >= limit) break
    }
    return files
  }

  // Recursive walk
  await walk(dir, files, limit, 0, signal)
  return files
}

const MAX_DEPTH = 20

async function walk(dir: string, out: string[], limit: number, depth: number, signal: AbortSignal): Promise<void> {
  if (out.length >= limit) return
  if (depth > MAX_DEPTH) return
  if (signal.aborted) return

  const { readdir } = await import("node:fs/promises")
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }

  // Files first, then dirs (depth-first). Dirent ile tür tespiti yapılır;
  // symlink'ler izlenmez (döngü riski) ve özel dosyalar (FIFO/socket/device)
  // atlanır — yalnızca gerçek dizinlere inilir, gerçek dosyalar toplanır.
  const subdirs: string[] = []
  for (const entry of entries) {
    if (out.length >= limit) return
    const name = entry.name
    if (name.startsWith(".")) continue
    if (SKIP_DIRS.has(name)) continue

    const full = join(dir, name)
    if (entry.isFile()) {
      const ext = name.slice(name.lastIndexOf("."))
      if (SUPPORTED_EXTS.has(ext)) out.push(full)
    } else if (entry.isDirectory()) {
      subdirs.push(full)
    }
    // symlink / FIFO / socket / char/block device → atla
  }

  for (const sub of subdirs) {
    if (out.length >= limit) return
    if (signal.aborted) return
    await walk(sub, out, limit, depth + 1, signal)
  }
}

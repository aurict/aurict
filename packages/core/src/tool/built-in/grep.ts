import { z } from "zod"
import { resolve, join, relative, basename } from "path"
import { readdir, stat } from "node:fs/promises"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

const MAX_MATCHES   = 200
const MAX_FILE_SIZE = 2_000_000   // 2MB - buyuk/uretilmis dosyalari atla
const TIMEOUT_MS    = 15_000

// Kosulsuz atlanan dizinler (buyuk, alakasiz veya symlink dongusu riski tasiyan).
// glob tool'undaki liste ile tutarli tutulur.
const SKIP_DIRS = new Set([
  "node_modules", ".git", ".svn", ".hg", ".bzr",
  "dist", "build", "out", ".output", ".next", ".nuxt",
  "coverage", ".nyc_output",
  "__pycache__", ".venv", "venv",
  ".cache", ".parcel-cache", ".turbo",
  ".yarn", ".pnp",
])

// Dizin agacini yurur; SKIP_DIRS'i atlar, symlink dizinleri izlemez
// (dairesel symlink'lerde sonsuz dongu onlenir). Yalnizca gercek dosyalari doner.
async function* walkFiles(
  dir:    string,
  root:   string,
  signal: AbortSignal,
): AsyncGenerator<string> {
  if (signal.aborted) return
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return  // okunamayan dizin - atla
  }
  for (const entry of entries) {
    if (signal.aborted) return
    if (entry.isDirectory() && !entry.isSymbolicLink()) {
      if (!SKIP_DIRS.has(entry.name)) {
        yield* walkFiles(join(dir, entry.name), root, signal)
      }
    } else if (entry.isFile()) {
      yield relative(root, join(dir, entry.name))
    }
  }
}

export const grepTool: ToolDef = {
  id:          "grep",
  description: "Search for a pattern in files. Returns matching lines with file names and line numbers.",
  parameters:  z.object({
    pattern:  z.string().describe("Search pattern (string or regex)"),
    path:     z.string().optional().describe("File or directory to search (defaults to project root)"),
    glob:     z.string().optional().describe("File glob filter e.g. '*.ts'"),
    case_sensitive: z.boolean().optional().describe("Case-sensitive search (default: false)"),
  }),
  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const pattern       = String(args["pattern"] ?? "")
    const searchPath    = resolve(ctx.workdir, String(args["path"] ?? "."))
    const globPattern   = String(args["glob"] ?? "**/*")
    const caseSensitive = args["case_sensitive"] === true

    let re: RegExp
    try {
      re = new RegExp(pattern, caseSensitive ? "g" : "gi")
    } catch (err) {
      return { output: `Invalid regex pattern: ${String(err)}` }
    }

    // "*.ts" gibi düz uzantı filtreleri alt dizin dosyalarını eşleştirmez;
    // eğer pattern "/" içermiyorsa otomatik "**/<pattern>" yap.
    const normalizedGlob = globPattern.includes("/") || globPattern.startsWith("**")
      ? globPattern
      : `**/${globPattern}`
    const fileGlob = new Bun.Glob(normalizedGlob)
    const matches: string[] = []

    // path tek bir dosyayi gosteriyorsa yalnizca onu tara (walkFiles dizin bekler).
    let singleFile: string | undefined
    try { if ((await stat(searchPath)).isFile()) singleFile = searchPath } catch { /* yoksa walk */ }

    // Iptal + genel timeout (glob tool'undaki desenle tutarli).
    const ac = new AbortController()
    const onParentAbort = () => ac.abort()
    ctx.signal.addEventListener("abort", onParentAbort, { once: true })
    let timedOut = false
    const timer = setTimeout(() => { timedOut = true; ac.abort() }, TIMEOUT_MS)

    // Tek dosya modunda yalnizca o dosyayi, aksi halde dizin agacini gez.
    async function* candidates(): AsyncGenerator<{ rel: string; abs: string }> {
      if (singleFile) {
        yield { rel: basename(singleFile), abs: singleFile }
        return
      }
      for await (const rel of walkFiles(searchPath, searchPath, ac.signal)) {
        yield { rel, abs: join(searchPath, rel) }
      }
    }

    try {
      for await (const { rel, abs } of candidates()) {
        if (ac.signal.aborted) break
        if (!singleFile && !fileGlob.match(rel)) continue

        const file = Bun.file(abs)
        if (file.size > MAX_FILE_SIZE) continue

        let content: string
        try {
          // 3s per-file timeout
          content = await Promise.race([
            file.text(),
            new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 3_000)),
          ])
        } catch { continue }
        if (content.includes("\u0000")) continue   // binary dosya - atla

        const lines = content.split("\n")
        for (let i = 0; i < lines.length; i++) {
          re.lastIndex = 0
          if (re.test(lines[i]!)) {
            matches.push(`${rel}:${i + 1}: ${lines[i]!.trim()}`)
            if (matches.length >= MAX_MATCHES) break
          }
        }
        if (matches.length >= MAX_MATCHES) break
      }
    } finally {
      clearTimeout(timer)
      ctx.signal.removeEventListener("abort", onParentAbort)
    }

    if (matches.length >= MAX_MATCHES) matches.push(`... (truncated at ${MAX_MATCHES})`)
    if (timedOut)                      matches.push(`... (timed out after ${TIMEOUT_MS / 1000}s - partial results)`)

    if (matches.length === 0) return { output: "(no matches)" }
    return { output: matches.join("\n") }
  },
}

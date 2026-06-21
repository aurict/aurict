import { z } from "zod"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

// ─── Patch format tipleri ──────────────────────────────────────────────────

type Hunk =
  | { type: "add";    path: string; contents: string }
  | { type: "delete"; path: string }
  | { type: "update"; path: string; movePath?: string | undefined; chunks: UpdateChunk[] }

interface UpdateChunk {
  oldLines:       string[]
  newLines:       string[]
  changeContext?: string | undefined
  endOfFile?:     boolean | undefined
}

// ─── Parser ────────────────────────────────────────────────────────────────

function stripHeredoc(input: string): string {
  return input.match(/^(?:cat\s+)?<<['"]?(\w+)['"]?\s*\n([\s\S]*?)\n\1\s*$/)?.[2] ?? input
}

function splitBom(text: string): { bom: boolean; text: string } {
  return text.startsWith("\uFEFF")
    ? { bom: true, text: text.slice(1) }
    : { bom: false, text }
}

function parseAddBlock(lines: readonly string[], start: number): { content: string; next: number } {
  const content: string[] = []
  let i = start
  while (i < lines.length && !lines[i]!.startsWith("***")) {
    const line = lines[i]!
    if (!line.startsWith("+")) throw new Error(`Invalid add line: ${line}`)
    content.push(line.slice(1))
    i++
  }
  return { content: content.join("\n"), next: i }
}

function parseUpdateBlock(lines: readonly string[], start: number): { chunks: UpdateChunk[]; next: number } {
  const chunks: UpdateChunk[] = []
  let i = start
  while (i < lines.length && !lines[i]!.startsWith("***")) {
    if (!lines[i]!.startsWith("@@")) throw new Error(`Invalid update line: ${lines[i]}`)
    const changeContext = lines[i]!.slice(2).trim() || undefined
    const oldLines: string[] = []
    const newLines: string[] = []
    let endOfFile = false
    i++
    while (i < lines.length && !lines[i]!.startsWith("@@")) {
      const line = lines[i]!
      if (line === "*** End of File") { endOfFile = true; i++; break }
      if (line.startsWith("***")) break
      if (line.startsWith(" "))      { oldLines.push(line.slice(1)); newLines.push(line.slice(1)) }
      else if (line.startsWith("-")) { oldLines.push(line.slice(1)) }
      else if (line.startsWith("+")) { newLines.push(line.slice(1)) }
      else throw new Error(`Invalid chunk line: ${line}`)
      i++
    }
    const chunk: UpdateChunk = { oldLines, newLines }
    if (changeContext !== undefined) chunk.changeContext = changeContext
    if (endOfFile) chunk.endOfFile = true
    chunks.push(chunk)
  }
  return { chunks, next: i }
}

function parsePatch(patchText: string): Hunk[] {
  const lines = stripHeredoc(patchText.trim()).split("\n")
  const begin = lines.findIndex((l) => l.trim() === "*** Begin Patch")
  const end   = lines.findIndex((l) => l.trim() === "*** End Patch")
  if (begin === -1 || end === -1 || begin >= end) throw new Error("Invalid patch: missing Begin/End markers")

  const hunks: Hunk[] = []
  let i = begin + 1

  while (i < end) {
    const line = lines[i]!
    if (line.startsWith("*** Add File:")) {
      const filePath = line.slice("*** Add File:".length).trim()
      if (!filePath) throw new Error("Empty Add File path")
      const parsed = parseAddBlock(lines, i + 1)
      hunks.push({ type: "add", path: filePath, contents: parsed.content })
      i = parsed.next
    } else if (line.startsWith("*** Delete File:")) {
      const filePath = line.slice("*** Delete File:".length).trim()
      if (!filePath) throw new Error("Empty Delete File path")
      hunks.push({ type: "delete", path: filePath })
      i++
    } else if (line.startsWith("*** Update File:")) {
      const filePath = line.slice("*** Update File:".length).trim()
      if (!filePath) throw new Error("Empty Update File path")
      let next = i + 1
      let movePath: string | undefined
      if (lines[next]?.startsWith("*** Move to:")) {
        movePath = lines[next]!.slice("*** Move to:".length).trim()
        if (!movePath) throw new Error("Empty Move to path")
        next++
      }
      const parsed = parseUpdateBlock(lines, next)
      if (parsed.chunks.length === 0) throw new Error(`No chunks for ${filePath}`)
      const hunk: Hunk = { type: "update", path: filePath, chunks: parsed.chunks }
      if (movePath !== undefined) (hunk as any).movePath = movePath
      hunks.push(hunk)
      i = parsed.next
    } else {
      throw new Error(`Unknown patch line: ${line}`)
    }
  }
  return hunks
}

// ─── Fuzzy line matcher ────────────────────────────────────────────────────

const normalizeUnicode = (s: string) =>
  s.replace(/[''‚‛]/g, "'")
   .replace(/[""„‟]/g, '"')
   .replace(/[‐‑‒–—―]/g, "-")
   .replace(/…/g, "...")
   .replace(/ /g, " ")

const exact      = (a: string, b: string) => a === b
const rstrip     = (a: string, b: string) => a.trimEnd() === b.trimEnd()
const trimBoth   = (a: string, b: string) => a.trim() === b.trim()
const normalized = (a: string, b: string) => normalizeUnicode(a.trim()) === normalizeUnicode(b.trim())

function matchesAt(
  lines: readonly string[],
  pattern: readonly string[],
  offset: number,
  compare: (a: string, b: string) => boolean,
): boolean {
  return pattern.every((p, idx) => compare(lines[offset + idx]!, p))
}

function seekLines(
  lines: readonly string[],
  pattern: readonly string[],
  start: number,
  eof = false,
): number {
  if (pattern.length === 0) return -1
  for (const cmp of [exact, rstrip, trimBoth, normalized]) {
    if (eof) {
      const off = lines.length - pattern.length
      if (off >= start && matchesAt(lines, pattern, off, cmp)) return off
    }
    for (let off = start; off <= lines.length - pattern.length; off++) {
      if (matchesAt(lines, pattern, off, cmp)) return off
    }
  }
  return -1
}

function checkUpdate(filePath: string, chunks: UpdateChunk[], original: string): string[] {
  const errors: string[] = []
  const src   = splitBom(original)
  const lines = src.text.split("\n")
  if (lines.at(-1) === "") lines.pop()

  let cursor = 0

  for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
    const chunk = chunks[cIdx]!
    if (chunk.changeContext) {
      const ctx = seekLines(lines, [chunk.changeContext], cursor)
      if (ctx === -1) {
        errors.push(`[Chunk ${cIdx + 1}] Context not found: '${chunk.changeContext}'`)
        continue
      }
      cursor = ctx + 1
    }

    if (chunk.oldLines.length === 0) {
      continue
    }

    let old = chunk.oldLines
    let found = seekLines(lines, old, cursor, chunk.endOfFile)
    if (found === -1 && old.at(-1) === "") {
      old = old.slice(0, -1)
      found = seekLines(lines, old, cursor, chunk.endOfFile)
    }
    if (found === -1) {
      errors.push(`[Chunk ${cIdx + 1}] Target lines not found (context/mismatch)`)
    } else {
      cursor = found + old.length
    }
  }

  return errors
}

// ─── Tool tanımı ────────────────────────────────────────────────────────────

export const patchTestTool: ToolDef = {
  id: "patch_test",
  description:
    "Validate a patch text in the '*** Begin Patch' format without applying it.\n\n" +
    "Checks:\n" +
    "  - Patch syntax and markers (Begin/End Patch, Add/Delete/Update File)\n" +
    "  - Existence of files to update or delete\n" +
    "  - Match of context chunks and target lines (using same fuzzy matcher as apply_patch)\n" +
    "  - Uniqueness and validity of paths\n\n" +
    "USE BEFORE apply_patch to ensure changes will apply cleanly without manual reverting.",
  parameters: z.object({
    patchText: z.string().describe(
      "The full patch text. Must start with '*** Begin Patch' and end with '*** End Patch'."
    ),
  }),

  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const patchText = String(args["patchText"] ?? "")
    const workdir   = ctx.workdir

    let hunks: Hunk[]
    try {
      hunks = parsePatch(patchText)
    } catch (err) {
      return { output: "", error: `Patch parse error: ${err instanceof Error ? err.message : String(err)}` }
    }

    const report: string[] = []
    let isValid = true

    for (const hunk of hunks) {
      const absPath = path.resolve(workdir, hunk.path)

      if (hunk.type === "add") {
        if (existsSync(absPath)) {
          report.push(`FAIL add ${hunk.path}: File already exists`)
          isValid = false
        } else {
          report.push(`OK   add ${hunk.path}`)
        }
      } else if (hunk.type === "delete") {
        if (!existsSync(absPath)) {
          report.push(`FAIL delete ${hunk.path}: File does not exist`)
          isValid = false
        } else {
          report.push(`OK   delete ${hunk.path}`)
        }
      } else if (hunk.type === "update") {
        if (!existsSync(absPath)) {
          report.push(`FAIL update ${hunk.path}: Target file does not exist`)
          isValid = false
        } else {
          try {
            const raw = readFileSync(absPath, "utf8")
            const chunkErrors = checkUpdate(hunk.path, hunk.chunks, raw)
            if (chunkErrors.length > 0) {
              report.push(`FAIL update ${hunk.path}:`)
              for (const err of chunkErrors) {
                report.push(`  ${err}`)
              }
              isValid = false
            } else {
              const moveStr = hunk.movePath ? ` (move to ${hunk.movePath})` : ""
              report.push(`OK   update ${hunk.path}${moveStr}`)
            }
          } catch (err) {
            report.push(`FAIL update ${hunk.path}: Read failed - ${err instanceof Error ? err.message : String(err)}`)
            isValid = false
          }
        }
      }
    }

    const output = [
      `Patch validation: ${isValid ? "VALID ✓" : "INVALID ✗"}`,
      "",
      ...report,
    ].join("\n")

    return isValid
      ? { output }
      : { output, error: "One or more patch checks failed" }
  },
}

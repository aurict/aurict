import { z } from "zod"
import { readFile, writeFile, mkdir, unlink } from "node:fs/promises"
import path from "node:path"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"
import { snapshotManager } from "../../snapshot/snapshot.js"

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

interface FileUpdate {
  content: string
  bom:     boolean
}

interface StagedFile {
  relPath: string
  absPath: string
  beforeExists: boolean
  beforeContent: string
  afterExists: boolean
  afterContent: string
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

function joinBom(text: string, bom: boolean): string {
  const stripped = splitBom(text).text
  return bom ? `\uFEFF${stripped}` : stripped
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
      if (movePath !== undefined) (hunk as { type: "update"; path: string; movePath?: string; chunks: UpdateChunk[] }).movePath = movePath
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

// ─── Patch applier ─────────────────────────────────────────────────────────

function deriveUpdate(filePath: string, chunks: UpdateChunk[], original: string): FileUpdate {
  const src   = splitBom(original)
  const lines = src.text.split("\n")
  if (lines.at(-1) === "") lines.pop()

  // Replacement'ları hesapla [start, deleteCount, insertLines]
  const replacements: Array<readonly [number, number, string[]]> = []
  let cursor = 0

  for (const chunk of chunks) {
    if (chunk.changeContext) {
      const ctx = seekLines(lines, [chunk.changeContext], cursor)
      if (ctx === -1) throw new Error(`Context not found: '${chunk.changeContext}' in ${filePath}`)
      cursor = ctx + 1
    }

    if (chunk.oldLines.length === 0) {
      replacements.push([lines.length, 0, chunk.newLines])
      continue
    }

    let old = chunk.oldLines
    let neu = chunk.newLines

    let found = seekLines(lines, old, cursor, chunk.endOfFile)
    // trailing boş satır varsa yeniden dene
    if (found === -1 && old.at(-1) === "") {
      old = old.slice(0, -1)
      if (neu.at(-1) === "") neu = neu.slice(0, -1)
      found = seekLines(lines, old, cursor, chunk.endOfFile)
    }
    if (found === -1) throw new Error(`Lines not found in ${filePath}:\n${chunk.oldLines.join("\n")}`)

    replacements.push([found, old.length, neu])
    cursor = found + old.length
  }

  // Tersine sıralanmış uygulama (son satırdan başa)
  const mutable = [...lines]
  for (const [start, del, ins] of [...replacements].sort((a, b) => b[0] - a[0])) {
    mutable.splice(start, del, ...ins)
  }

  if (mutable.at(-1) !== "") mutable.push("")
  const next = splitBom(mutable.join("\n"))
  return { content: next.text, bom: src.bom || next.bom }
}

async function readExistingFile(absPath: string): Promise<{ exists: boolean; content: string }> {
  try {
    return { exists: true, content: await readFile(absPath, "utf8") }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return { exists: false, content: "" }
    }
    throw err
  }
}

async function stagePatch(workdir: string, hunks: Hunk[]): Promise<{ staged: StagedFile[]; applied: string[] }> {
  const staged = new Map<string, StagedFile>()
  const applied: string[] = []
  const root = path.resolve(workdir)

  const resolveInsideWorkdir = (relPath: string): string => {
    const absPath = path.resolve(root, relPath)
    const relative = path.relative(root, absPath)
    if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error(`Patch path escapes working directory: ${relPath}`)
    }
    return absPath
  }

  const getStaged = async (relPath: string): Promise<StagedFile> => {
    const absPath = resolveInsideWorkdir(relPath)
    const existing = staged.get(absPath)
    if (existing) return existing

    const current = await readExistingFile(absPath)
    const file: StagedFile = {
      relPath,
      absPath,
      beforeExists: current.exists,
      beforeContent: current.content,
      afterExists: current.exists,
      afterContent: current.content,
    }
    staged.set(absPath, file)
    return file
  }

  for (const hunk of hunks) {
    if (hunk.type === "add") {
      const file = await getStaged(hunk.path)
      if (file.afterExists) throw new Error(`Add File target already exists: ${hunk.path}`)
      file.afterExists = true
      file.afterContent = hunk.contents
      applied.push(`A ${hunk.path}`)
      continue
    }

    if (hunk.type === "delete") {
      const file = await getStaged(hunk.path)
      if (!file.afterExists) throw new Error(`Delete File target does not exist: ${hunk.path}`)
      file.afterExists = false
      file.afterContent = ""
      applied.push(`D ${hunk.path}`)
      continue
    }

    const file = await getStaged(hunk.path)
    if (!file.afterExists) throw new Error(`Update File target does not exist: ${hunk.path}`)
    const update = deriveUpdate(hunk.path, hunk.chunks, file.afterContent)
    const final = joinBom(update.content, update.bom)

    if (hunk.movePath) {
      const target = await getStaged(hunk.movePath)
      if (target.afterExists) throw new Error(`Move target already exists: ${hunk.movePath}`)
      target.afterExists = true
      target.afterContent = final
      file.afterExists = false
      file.afterContent = ""
      applied.push(`R ${hunk.path} -> ${hunk.movePath}`)
    } else {
      file.afterContent = final
      applied.push(`M ${hunk.path}`)
    }
  }

  const changed = [...staged.values()].filter((file) =>
    file.beforeExists !== file.afterExists || file.beforeContent !== file.afterContent
  )

  return { staged: changed, applied }
}

async function writeStagedFile(file: StagedFile): Promise<void> {
  if (!file.afterExists) {
    try {
      await unlink(file.absPath)
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err
    }
    return
  }

  await mkdir(path.dirname(file.absPath), { recursive: true })
  await writeFile(file.absPath, file.afterContent, "utf8")
}

// ─── Tool tanımı ────────────────────────────────────────────────────────────

export const applyPatchTool: ToolDef = {
  id:          "apply_patch",
  description:
    "Apply a multi-file patch in the '*** Begin Patch' format. " +
    "Supports Add File, Delete File, Update File (with @@ context chunks), " +
    "and Move to (rename). All paths are resolved relative to the project working directory. " +
    "The patch is staged before writing; if validation fails, no file is modified. " +
    "If a write fails after staging, Aurict restores the checkpoint it created before the write phase.",
  parameters: z.object({
    patchText: z.string().describe(
      "The full patch text. Must start with '*** Begin Patch' and end with '*** End Patch'. " +
      "Each file operation is prefixed with '*** Add File:', '*** Delete File:', or '*** Update File:'."
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

    let plan: { staged: StagedFile[]; applied: string[] }
    try {
      plan = await stagePatch(workdir, hunks)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { output: "", error: `Patch validation failed: ${msg}` }
    }

    const mark = snapshotManager.mark()
    try {
      for (const file of plan.staged) {
        await snapshotManager.takeSnapshot(file.absPath)
      }
      for (const file of plan.staged) {
        await writeStagedFile(file)
      }
    } catch (err) {
      await snapshotManager.restoreToMark(mark)
      const msg = err instanceof Error ? err.message : String(err)
      return { output: "", error: `Patch write failed; restored checkpoint: ${msg}` }
    }

    const lines: string[] = []
    if (plan.applied.length > 0) {
      lines.push("Applied patch:")
      lines.push(...plan.applied)
    }

    return { output: lines.join("\n") }
  },
}

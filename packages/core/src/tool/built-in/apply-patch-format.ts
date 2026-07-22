export type PatchHunk =
  | { type: "add"; path: string; contents: string }
  | { type: "delete"; path: string }
  | { type: "update"; path: string; movePath?: string | undefined; chunks: PatchUpdateChunk[] }

export interface PatchUpdateChunk {
  oldLines: string[]
  newLines: string[]
  addedCount: number
  removedCount: number
  changeContext?: string | undefined
  endOfFile?: boolean | undefined
}

export interface PatchFileSummary {
  path: string
  action: "add" | "delete" | "update" | "move"
  targetPath?: string
  added: number
  removed: number
}

export interface PatchSummary {
  files: PatchFileSummary[]
  added: number
  removed: number
}

function stripHeredoc(input: string): string {
  return input.match(/^(?:cat\s+)?<<['"]?(\w+)['"]?\s*\n([\s\S]*?)\n\1\s*$/)?.[2] ?? input
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

function parseUpdateBlock(lines: readonly string[], start: number): { chunks: PatchUpdateChunk[]; next: number } {
  const chunks: PatchUpdateChunk[] = []
  let i = start
  while (i < lines.length && !lines[i]!.startsWith("***")) {
    if (!lines[i]!.startsWith("@@")) throw new Error(`Invalid update line: ${lines[i]}`)
    const changeContext = lines[i]!.slice(2).trim() || undefined
    const oldLines: string[] = []
    const newLines: string[] = []
    let addedCount = 0
    let removedCount = 0
    let endOfFile = false
    i++
    while (i < lines.length && !lines[i]!.startsWith("@@")) {
      const line = lines[i]!
      if (line === "*** End of File") { endOfFile = true; i++; break }
      if (line.startsWith("***")) break
      if (line.startsWith(" ")) { oldLines.push(line.slice(1)); newLines.push(line.slice(1)) }
      else if (line.startsWith("-")) { oldLines.push(line.slice(1)); removedCount++ }
      else if (line.startsWith("+")) { newLines.push(line.slice(1)); addedCount++ }
      else throw new Error(`Invalid chunk line: ${line}`)
      i++
    }
    const chunk: PatchUpdateChunk = { oldLines, newLines, addedCount, removedCount }
    if (changeContext !== undefined) chunk.changeContext = changeContext
    if (endOfFile) chunk.endOfFile = true
    chunks.push(chunk)
  }
  return { chunks, next: i }
}

export function parsePatch(patchText: string): PatchHunk[] {
  const lines = stripHeredoc(patchText.trim()).split("\n")
  const begin = lines.findIndex((line) => line.trim() === "*** Begin Patch")
  const end = lines.findIndex((line) => line.trim() === "*** End Patch")
  if (begin === -1 || end === -1 || begin >= end) throw new Error("Invalid patch: missing Begin/End markers")

  const hunks: PatchHunk[] = []
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
      hunks.push({ type: "update", path: filePath, ...(movePath ? { movePath } : {}), chunks: parsed.chunks })
      i = parsed.next
    } else {
      throw new Error(`Unknown patch line: ${line}`)
    }
  }
  return hunks
}

function countTextLines(text: string): number {
  if (text.length === 0) return 0
  return text.endsWith("\n") ? text.slice(0, -1).split("\n").length : text.split("\n").length
}

export function summarizePatchText(patchText: string): PatchSummary {
  const files: PatchFileSummary[] = parsePatch(patchText).map((hunk) => {
    if (hunk.type === "add") return { path: hunk.path, action: "add", added: countTextLines(hunk.contents), removed: 0 }
    if (hunk.type === "delete") return { path: hunk.path, action: "delete", added: 0, removed: 0 }
    return {
      path: hunk.path,
      action: hunk.movePath ? "move" : "update",
      ...(hunk.movePath ? { targetPath: hunk.movePath } : {}),
      added: hunk.chunks.reduce((sum, chunk) => sum + chunk.addedCount, 0),
      removed: hunk.chunks.reduce((sum, chunk) => sum + chunk.removedCount, 0),
    }
  })
  return {
    files,
    added: files.reduce((sum, file) => sum + file.added, 0),
    removed: files.reduce((sum, file) => sum + file.removed, 0),
  }
}

function blockPaths(lines: readonly string[], start: number, end: number): { path: string; targetPath?: string } | null {
  const header = lines[start] ?? ""
  const prefix = ["*** Add File:", "*** Delete File:", "*** Update File:"].find((value) => header.startsWith(value))
  if (!prefix) return null
  const sourcePath = header.slice(prefix.length).trim()
  if (!sourcePath) return null
  for (let i = start + 1; i < end; i++) {
    const line = lines[i] ?? ""
    if (line.startsWith("*** Move to:")) {
      const targetPath = line.slice("*** Move to:".length).trim()
      return targetPath ? { path: sourcePath, targetPath } : { path: sourcePath }
    }
  }
  return { path: sourcePath }
}

export function filterPatchTextByFiles(patchText: string, approvedFiles: readonly string[]): string {
  const approved = new Set(approvedFiles)
  const lines = stripHeredoc(patchText.trim()).split("\n")
  const begin = lines.findIndex((line) => line.trim() === "*** Begin Patch")
  const end = lines.findIndex((line) => line.trim() === "*** End Patch")
  if (begin === -1 || end === -1 || begin >= end) throw new Error("Invalid patch: missing Begin/End markers")

  const selectedBlocks: string[][] = []
  let i = begin + 1
  while (i < end) {
    const startsBlock = lines[i]?.startsWith("*** Add File:")
      || lines[i]?.startsWith("*** Delete File:")
      || lines[i]?.startsWith("*** Update File:")
    if (!startsBlock) throw new Error(`Unknown patch line: ${lines[i]}`)
    let next = i + 1
    while (next < end && !lines[next]?.startsWith("*** Add File:") && !lines[next]?.startsWith("*** Delete File:") && !lines[next]?.startsWith("*** Update File:")) next++
    const paths = blockPaths(lines, i, next)
    if (paths && (approved.has(paths.path) || (paths.targetPath && approved.has(paths.targetPath)))) selectedBlocks.push(lines.slice(i, next))
    i = next
  }
  if (selectedBlocks.length === 0) throw new Error("No patch files selected")
  return ["*** Begin Patch", ...selectedBlocks.flat(), "*** End Patch"].join("\n")
}

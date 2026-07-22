import { createHash } from "node:crypto"
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises"
import { join } from "node:path"

const HANDLE_PREFIX = "tool-output:"
const HANDLE_RE = /^tool-output:([a-f0-9]{64})$/

export interface StoredToolOutput {
  handle: string
  chars: number
}

export interface ToolOutputSlice {
  content: string
  offset: number
  nextOffset: number | null
  totalChars: number
}

export async function storeToolOutputArtifact(options: {
  workdir: string
  sessionId: string
  output: string
}): Promise<StoredToolOutput> {
  const hash = createHash("sha256").update(options.output).digest("hex")
  const directory = artifactDirectory(options.workdir, options.sessionId)
  const target = join(directory, `${hash}.txt`)
  await mkdir(directory, { recursive: true })

  try {
    const existing = await stat(target)
    if (existing.isFile()) return { handle: `${HANDLE_PREFIX}${hash}`, chars: options.output.length }
  } catch (error) {
    if (!isMissingFile(error)) throw error
  }

  const temporary = `${target}.${process.pid}.${crypto.randomUUID()}.tmp`
  let replaced = false
  try {
    await writeFile(temporary, options.output, "utf8")
    await rename(temporary, target)
    replaced = true
  } finally {
    if (!replaced) await rm(temporary, { force: true })
  }
  return { handle: `${HANDLE_PREFIX}${hash}`, chars: options.output.length }
}

export async function readToolOutputArtifact(options: {
  workdir: string
  sessionId: string
  handle: string
  offset?: number
  limit?: number
}): Promise<ToolOutputSlice> {
  const match = HANDLE_RE.exec(options.handle)
  if (!match?.[1]) throw new Error("Invalid tool output handle.")
  const content = await readFile(join(artifactDirectory(options.workdir, options.sessionId), `${match[1]}.txt`), "utf8")
  const offset = clampInteger(options.offset ?? 0, 0, content.length)
  const limit = clampInteger(options.limit ?? 16_000, 1, 50_000)
  const nextOffset = Math.min(content.length, offset + limit)
  return {
    content: content.slice(offset, nextOffset),
    offset,
    nextOffset: nextOffset < content.length ? nextOffset : null,
    totalChars: content.length,
  }
}

function artifactDirectory(workdir: string, sessionId: string): string {
  return join(workdir, ".aurict", "tool-results", safeSegment(sessionId))
}

function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "anonymous"
}

function clampInteger(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum
  return Math.min(maximum, Math.max(minimum, Math.floor(value)))
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT"
}

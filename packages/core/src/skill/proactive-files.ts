import { stat } from "node:fs/promises"
import { basename, extname, relative } from "node:path"
import { resolveWithinWorkspace } from "../security/path-boundary.js"
import { toPosix } from "../util/paths.js"

const PROACTIVE_FILE_RE = /(?:^|[\s`'"(,])([./\w-]+\.(?:ts|tsx|js|jsx|mts|mjs|py|go|rs|md|json|yaml|yml|css|html|sh|toml|env))(?=$|[\s`'"),\]])/gm
const MAX_PROACTIVE_FILES = 3
const MAX_PROACTIVE_CHARS = 6_000
const MAX_SINGLE_FILE_CHARS = 3_000
const MAX_FILE_SIZE_BYTES = 50_000
const SENSITIVE_CONFIG_RE = /(?:^|[-_.])(secret|secrets|credential|credentials|token|tokens|key|keys)(?:[-_.]|$)/i

export async function buildProactiveFileSection(userText: string, workdir: string): Promise<string> {
  if (!userText.trim()) return ""

  const mentioned = collectMentions(userText)
  if (mentioned.length === 0) return ""

  const sections: string[] = []
  let totalChars = 0

  for (const mention of mentioned.slice(0, MAX_PROACTIVE_FILES * 2)) {
    if (sections.length >= MAX_PROACTIVE_FILES || totalChars >= MAX_PROACTIVE_CHARS) break
    const resolved = await resolveFileMention(mention, workdir)
    if (!resolved) continue

    const file = Bun.file(resolved)
    if (file.size > MAX_FILE_SIZE_BYTES) continue
    const content = await file.text()
    const excerpt = content.slice(0, MAX_SINGLE_FILE_CHARS)
    const displayPath = toPosix(relative(workdir, resolved))
    const truncNote = content.length > MAX_SINGLE_FILE_CHARS ? "\n... [truncated]" : ""
    const extension = extname(displayPath).slice(1)
    sections.push(`### ${displayPath}\n\`\`\`${extension}\n${excerpt}${truncNote}\n\`\`\``)
    totalChars += excerpt.length
  }

  if (sections.length === 0) return ""
  return `## Files Referenced in Your Request\n\n${sections.join("\n\n")}`
}

function collectMentions(userText: string): string[] {
  const mentioned = new Set<string>()
  const re = new RegExp(PROACTIVE_FILE_RE.source, PROACTIVE_FILE_RE.flags)
  let match: RegExpExecArray | null
  while ((match = re.exec(userText)) !== null) {
    const raw = (match[1] ?? "").trim()
    if (raw.length > 3) mentioned.add(raw)
  }
  return [...mentioned]
}

async function resolveFileMention(mention: string, workdir: string): Promise<string | null> {
  if (mention.startsWith("/") || mention.split("/").includes("..") || isSensitiveMention(mention)) {
    return null
  }

  const direct = await resolveSafeFile(workdir, mention)
  if (direct) return direct

  const filename = basename(mention)
  if (filename !== mention || isSensitiveMention(filename)) return null
  const glob = new Bun.Glob(`**/${filename}`)
  for await (const found of glob.scan({ cwd: workdir, absolute: false, onlyFiles: true })) {
    const resolved = await resolveSafeFile(workdir, found)
    if (resolved) return resolved
  }
  return null
}

async function resolveSafeFile(workdir: string, inputPath: string): Promise<string | null> {
  try {
    const resolved = await resolveWithinWorkspace(workdir, inputPath)
    const info = await stat(resolved)
    return info.isFile() ? resolved : null
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null
    if (error instanceof Error && /Path (?:escapes|traverses)/.test(error.message)) return null
    throw error
  }
}

function isSensitiveMention(path: string): boolean {
  const name = basename(path)
  if (name === ".env" || name.startsWith(".env.") || extname(name).toLowerCase() === ".env") return true
  const extension = extname(name).toLowerCase()
  return [".json", ".yaml", ".yml", ".toml"].includes(extension) && SENSITIVE_CONFIG_RE.test(name)
}

import { join } from "node:path"
import { existsSync, readFileSync } from "node:fs"

const MAX_ARCHITECTURE_CHARS = 4_000

export function readArchitecture(workdir: string): string {
  const path = join(workdir, ".aurict", "architecture.md")
  if (!existsSync(path)) return ""
  try {
    let content = readFileSync(path, "utf8").trim()
    if (!content) return ""
    if (content.length > MAX_ARCHITECTURE_CHARS) {
      content = content.slice(0, MAX_ARCHITECTURE_CHARS) + "\n\n[... truncated — file exceeds 4 000 chars]"
    }
    return `## Project Architecture\n\n${content}`
  } catch { return "" }
}

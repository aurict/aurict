/**
 * Remote skill yükleyici.
 * GitHub raw URL veya HTTP URL'den SKILL.md indirir, ~/.omnicod/skills/ altına kaydeder.
 */

import { join } from "path"
import { homedir } from "os"
import { mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync, existsSync } from "fs"
import { parseFrontmatter } from "./frontmatter.js"

const REMOTE_SKILLS_DIR = join(homedir(), ".omnicod", "skills")

export interface RemoteSkillMeta {
  id:          string
  name:        string
  description: string
  source:      string   // original URL or "local"
  filePath:    string
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function ensureDir(): void {
  mkdirSync(REMOTE_SKILLS_DIR, { recursive: true })
}

export async function installRemoteSkill(url: string): Promise<RemoteSkillMeta> {
  // Normalize GitHub blob URLs → raw URL
  const rawUrl = url
    .replace("github.com", "raw.githubusercontent.com")
    .replace("/blob/", "/")

  const resp = await fetch(rawUrl)
  if (!resp.ok) throw new Error(`Failed to download skill from ${rawUrl}: HTTP ${resp.status}`)

  const content = await resp.text()
  if (!content.includes("SKILL") && !content.startsWith("---")) {
    throw new Error("Downloaded content does not look like a SKILL.md file")
  }

  const { meta } = parseFrontmatter(content)
  const name  = meta.name   || "unnamed"
  const id    = slugify(name)
  if (!id) throw new Error("Could not derive skill ID from name in frontmatter")

  ensureDir()
  const filePath = join(REMOTE_SKILLS_DIR, `${id}.md`)
  writeFileSync(filePath, content, "utf8")

  // Save source metadata alongside
  const metaPath = join(REMOTE_SKILLS_DIR, `${id}.meta.json`)
  writeFileSync(metaPath, JSON.stringify({ source: url }), "utf8")

  return { id, name, description: meta.description || "", source: url, filePath }
}

export function listInstalledSkills(): RemoteSkillMeta[] {
  ensureDir()
  const results: RemoteSkillMeta[] = []

  let files: string[]
  try { files = readdirSync(REMOTE_SKILLS_DIR) } catch { return [] }

  for (const f of files) {
    if (!f.endsWith(".md")) continue
    const id       = f.replace(/\.md$/, "")
    const filePath = join(REMOTE_SKILLS_DIR, f)

    let raw = ""
    try { raw = readFileSync(filePath, "utf8") } catch { continue }

    const { meta } = parseFrontmatter(raw)

    let source = "local"
    try {
      const metaPath = join(REMOTE_SKILLS_DIR, `${id}.meta.json`)
      const m = JSON.parse(readFileSync(metaPath, "utf8")) as { source?: string }
      if (m.source) source = m.source
    } catch { /* no meta */ }

    results.push({ id, name: meta.name || id, description: meta.description || "", source, filePath })
  }

  return results
}

export function uninstallSkill(id: string): boolean {
  ensureDir()
  const filePath  = join(REMOTE_SKILLS_DIR, `${id}.md`)
  const metaPath  = join(REMOTE_SKILLS_DIR, `${id}.meta.json`)
  if (!existsSync(filePath)) return false
  try {
    unlinkSync(filePath)
    try { unlinkSync(metaPath) } catch { /* ok */ }
    return true
  } catch { return false }
}

export { REMOTE_SKILLS_DIR }

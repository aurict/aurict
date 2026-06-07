import { detectSkills } from "./detector.js"
import { loadSkills, loadSkill } from "./loader.js"
import { SkillRegistry } from "./registry.js"
import { autoInvoker } from "./auto-invoke.js"
import { hooks } from "../hook/emitter.js"
import { countTokens } from "../provider/tokenizer.js"
import { FULL_SYSTEM_PROMPT } from "../agent/system.js"
import { memoryStore } from "../memory/store.js"
import { pinStore } from "../pin/store.js"
import { execSync } from "child_process"
import { join } from "node:path"
import { homedir } from "node:os"
import { readdirSync, existsSync } from "node:fs"
import type { LoadedSkill, SkillDef } from "./types.js"

const MAX_SKILL_TOKENS = 6_000   // tüm skill'ler için toplam token bütçesi

// ─── Multi-dir cache ──────────────────────────────────────────────────────────
interface CacheEntry { skills: LoadedSkill[]; expiresAt: number }
const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60_000  // 1 dakika sonra yeniden detect

export async function buildSystemPrompt(projectDir: string, base?: string): Promise<string> {
  const skills = await getSkillsForProject(projectDir)
  const finalBase = [FULL_SYSTEM_PROMPT, base].filter(Boolean).join("\n\n---\n\n")

  const skillSection  = skills.length > 0 ? buildSkillSection(skills) : ""
  const memorySection = buildMemorySection(projectDir)
  const pinSection    = pinStore.toPromptSection(projectDir)
  const gitSection    = buildGitSection(projectDir)

  return [finalBase, pinSection, gitSection, skillSection, memorySection]
    .filter(Boolean)
    .join("\n\n")
    .trim()
}

function buildGitSection(workdir: string): string {
  try {
    const g = (cmd: string) => execSync(`git ${cmd}`, { cwd: workdir, encoding: "utf8", stdio: ["pipe","pipe","pipe"] }).trim()
    // Git repo değilse skip
    g("rev-parse --git-dir")
    const branch   = g("branch --show-current")
    const status   = g("status --short")
    const lastLog  = g("log --oneline -3")
    const lines = ["## Git Context", `Branch: ${branch}`]
    if (status) lines.push(`Changes:\n${status}`)
    if (lastLog) lines.push(`Recent commits:\n${lastLog}`)
    return lines.join("\n")
  } catch { return "" }
}

function buildMemorySection(workdir: string): string {
  try {
    const memories = memoryStore.getRelevant(workdir, 15, 600)
    if (!memories.length) return ""

    const lines = memories.map((m) => `[${m.category}] ${m.content}`)
    return [
      "## What I Remember",
      "The following was learned from previous sessions:",
      "",
      ...lines,
    ].join("\n")
  } catch { return "" }
}

async function loadCustomSkills(projectDir: string): Promise<LoadedSkill[]> {
  const dirs = [
    join(homedir(), ".omnicod", "skills"),   // global
    join(projectDir, ".omnicod", "skills"),  // project (override)
  ]
  const results: LoadedSkill[] = []
  const seen = new Set<string>()

  for (const dir of dirs) {
    if (!existsSync(dir)) continue
    let files: string[]
    try { files = readdirSync(dir).filter(f => f.endsWith(".md")) } catch { continue }

    for (const file of files) {
      const id = `custom:${file.replace(/\.md$/, "")}`
      const def: SkillDef = {
        id, name: file.replace(/\.md$/, ""),
        description: `Custom skill: ${file.replace(/\.md$/, "")}`,
        detector: {}, contentPath: join(dir, file),
        priority: 50, tags: ["custom"], requires: [],
      }
      const loaded = await loadSkill(def)
      // Project-level overrides global — replace if same id
      const existing = results.findIndex(s => s.id === id)
      if (existing >= 0) results[existing] = loaded
      else results.push(loaded)
      seen.add(id)
    }
  }
  return results
}

export async function getSkillsForProject(projectDir: string): Promise<LoadedSkill[]> {
  const now    = Date.now()
  const cached = cache.get(projectDir)
  if (cached && cached.expiresAt > now) return cached.skills

  const detected = await detectSkills(projectDir)

  // Skill dependency graph: her skill'in requires listesini çöz
  const withDeps = resolveSkillDeps(detected)

  // v1.context.inject hook — dış sistemler skill listesini değiştirebilir
  const injected  = await hooks.emit("v1.context.inject", { skillIds: withDeps.map((s) => s.id) })
  const finalIds  = new Set(injected.skillIds)
  const finalDefs = withDeps.filter((s) => finalIds.has(s.id))

  const loaded = await loadSkills(finalDefs)

  // Custom skills: ~/.omnicod/skills/ + <workdir>/.omnicod/skills/
  const custom = await loadCustomSkills(projectDir)

  // Token bütçesine sığacak şekilde filtrele (önce yüksek öncelikli)
  const selected = selectWithinBudget([...loaded, ...custom])

  cache.set(projectDir, { skills: selected, expiresAt: now + CACHE_TTL_MS })
  return selected
}

export async function getContextualSkills(filePath: string): Promise<LoadedSkill[]> {
  const skillIds = autoInvoker.check("file-edit", filePath)
  if (skillIds.length === 0) return []

  const defs = skillIds
    .map((id) => SkillRegistry.get(id))
    .filter((d): d is SkillDef => d !== undefined)

  if (defs.length === 0) return []
  return loadSkills(defs)
}

function resolveSkillDeps(skills: SkillDef[], depth = 0): SkillDef[] {
  if (depth >= 2) return skills
  const ids    = new Set(skills.map((s) => s.id))
  const extras: SkillDef[] = []

  for (const skill of skills) {
    for (const reqId of skill.requires ?? []) {
      if (ids.has(reqId)) continue
      const dep = SkillRegistry.get(reqId)
      if (dep) { ids.add(reqId); extras.push(dep) }
    }
  }

  if (extras.length === 0) return skills
  return resolveSkillDeps([...skills, ...extras], depth + 1)
}

export function clearSkillCache(): void {
  cache.clear()
}

// ─── Token bütçesi ile skill seçimi ──────────────────────────────────────────

function selectWithinBudget(skills: LoadedSkill[]): LoadedSkill[] {
  const selected: LoadedSkill[] = []
  let   total = 0

  // Skill'ler zaten öncelik sırasında geliyor (detector'dan)
  for (const skill of skills) {
    if (!skill.systemPrompt) continue  // içerik yoksa atla
    if (total + skill.tokenCount > MAX_SKILL_TOKENS) break
    selected.push(skill)
    total += skill.tokenCount
  }

  return selected
}

// ─── System prompt inşası ────────────────────────────────────────────────────

function buildSkillSection(skills: LoadedSkill[]): string {
  if (skills.length === 0) return ""

  const blocks = skills
    .filter((s) => s.systemPrompt.length > 0)
    .map((s) => `## [${s.name.toUpperCase()}]\n${s.systemPrompt}`)

  if (blocks.length === 0) return ""

  return [
    `# Active Skills (${skills.length}: ${skills.map((s) => s.id).join(", ")})`,
    blocks.join("\n\n---\n\n"),
  ].join("\n\n")
}

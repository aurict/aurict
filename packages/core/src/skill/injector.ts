import { detectSkills } from "./detector.js"
import { loadSkills, loadSkill, loadSkillAdaptive, detectTaskType } from "./loader.js"
import { SkillRegistry } from "./registry.js"
import { autoInvoker } from "./auto-invoke.js"
import { skillScoreStore } from "./score-store.js"
import { loadSkillOverride, applyOverride } from "./override.js"
import { hooks } from "../hook/emitter.js"
import { countTokens } from "../provider/tokenizer.js"
import { FULL_SYSTEM_PROMPT } from "../agent/system.js"
import { memoryStore } from "../memory/store.js"
import { pinStore } from "../pin/store.js"
import { readArchitecture } from "../project-context/architecture.js"
import { readDecisions } from "../project-context/decisions.js"
import { diagnosticsStore } from "../diagnostics/store.js"
import { execSync } from "child_process"
import { join } from "node:path"
import { homedir } from "node:os"
import { readdirSync, existsSync, readFileSync } from "node:fs"
import type { LoadedSkill, SkillDef } from "./types.js"

const MAX_SKILL_TOKENS        = 8_000   // total token budget for all skills
const MAX_INTENT_SKILL_TOKENS = 6_000   // per-message intent skill budget
const MAX_PROJECT_INSTRUCTIONS = 8_000  // character cap for CLAUDE.md / AGENTS.md content

// ─── Multi-dir cache ──────────────────────────────────────────────────────────
interface CacheEntry { skills: LoadedSkill[]; expiresAt: number }
const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60_000  // 1 dakika sonra yeniden detect

export async function buildSystemPrompt(projectDir: string, base?: string, includeGit = false): Promise<string> {
  const skills = await getSkillsForProject(projectDir)
  const finalBase = [FULL_SYSTEM_PROMPT, base].filter(Boolean).join("\n\n---\n\n")

  const skillSection        = skills.length > 0 ? buildSkillSection(skills) : ""
  const memorySection       = buildMemorySection(projectDir)
  const pinSection          = pinStore.toPromptSection(projectDir)
  const gitSection          = includeGit ? buildGitSection(projectDir) : ""
  const instructionsSection = readProjectInstructions(projectDir)
  const projectContextSection = buildProjectContextSection(projectDir)

  // Order: project instructions → project context → base system → pins → git → skills → memory
  return [instructionsSection, projectContextSection, finalBase, pinSection, gitSection, skillSection, memorySection]
    .filter(Boolean)
    .join("\n\n")
    .trim()
}

function buildProjectContextSection(workdir: string): string {
  const architecture  = readArchitecture(workdir)
  const decisions     = readDecisions(workdir)
  const diagnostics   = diagnosticsStore.toPromptSection(workdir)

  const parts = [architecture, decisions, diagnostics].filter(Boolean)
  if (parts.length === 0) return ""

  return [
    "# Project Context (.aurict/)",
    parts.join("\n\n"),
  ].join("\n\n")
}

/**
 * Reads CLAUDE.md / AGENTS.md from the project directory and the user's home dir.
 * Mirrors Claude Code's own CLAUDE.md injection behavior.
 * Priority order (last wins in terms of placement — prepended to system prompt):
 *   1. ~/.claude/CLAUDE.md        (global user instructions)
 *   2. <workdir>/CLAUDE.md        (project-level instructions)
 *   3. <workdir>/AGENTS.md        (alternative convention)
 *   4. <workdir>/.claude/CLAUDE.md (scoped project instructions)
 */
function readProjectInstructions(workdir: string): string {
  const candidates: Array<{ path: string; label: string }> = [
    { path: join(homedir(), ".claude", "CLAUDE.md"),   label: "Global (~/.claude/CLAUDE.md)" },
    { path: join(workdir, "CLAUDE.md"),                label: "Project (CLAUDE.md)" },
    { path: join(workdir, "AGENTS.md"),                label: "Project (AGENTS.md)" },
    { path: join(workdir, ".claude", "CLAUDE.md"),     label: "Project (.claude/CLAUDE.md)" },
  ]

  const sections: string[] = []

  for (const { path, label } of candidates) {
    if (!existsSync(path)) continue
    try {
      let content = readFileSync(path, "utf8").trim()
      if (!content) continue
      if (content.length > MAX_PROJECT_INSTRUCTIONS) {
        content = content.slice(0, MAX_PROJECT_INSTRUCTIONS) + "\n\n[... truncated — file exceeds 8 000 chars]"
      }
      sections.push(`# Project Instructions (${label})\n\n${content}`)
    } catch { /* unreadable — skip silently */ }
  }

  return sections.join("\n\n---\n\n")
}

export function buildGitSection(workdir: string): string {
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
    join(homedir(), ".aurict", "skills"),   // global
    join(projectDir, ".aurict", "skills"),  // project (override)
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

  // Score boost: proje geçmişinden gelen öncelik artışını uygula
  const boosted = withDeps.map((def) => {
    const boost = skillScoreStore.getBoost(projectDir, def.id)
    return boost !== 0 ? { ...def, priority: def.priority + boost } : def
  })

  // v1.context.inject hook — dış sistemler skill listesini değiştirebilir
  const injected  = await hooks.emit("v1.context.inject", { skillIds: boosted.map((s) => s.id) })
  const finalIds  = new Set(injected.skillIds)
  const finalDefs = boosted.filter((s) => finalIds.has(s.id))

  const loaded = await loadSkills(finalDefs)

  // Custom skills: ~/.aurict/skills/ + <workdir>/.aurict/skills/
  const custom = await loadCustomSkills(projectDir)

  // Token bütçesine sığacak şekilde filtrele (önce yüksek öncelikli)
  const preSelected = selectWithinBudget([...loaded, ...custom])

  // Proje-bazlı skill override'larını uygula
  const selected = preSelected.map((skill) => {
    const override = loadSkillOverride(projectDir, skill.id)
    return override ? applyOverride(skill, override) : skill
  })

  // Usage kaydet (1dk cache'i nedeniyle session'da bir kez çalışır)
  skillScoreStore.recordInject(projectDir, selected.map((s) => s.id))

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

// ─── Proactive file injection ─────────────────────────────────────────────────

const PROACTIVE_FILE_RE = /(?:^|[\s`'"(,])([./\w-]+\.(?:ts|tsx|js|jsx|mts|mjs|py|go|rs|md|json|yaml|yml|css|html|sh|toml|env))(?=$|[\s`'"),\]])/gm
const MAX_PROACTIVE_FILES  = 3
const MAX_PROACTIVE_CHARS  = 6_000
const MAX_SINGLE_FILE_CHARS = 3_000
const MAX_FILE_SIZE_BYTES   = 50_000

export async function buildProactiveFileSection(userText: string, workdir: string): Promise<string> {
  if (!userText.trim()) return ""

  const mentioned = new Set<string>()
  let m: RegExpExecArray | null
  const re = new RegExp(PROACTIVE_FILE_RE.source, PROACTIVE_FILE_RE.flags)
  while ((m = re.exec(userText)) !== null) {
    const raw = (m[1] ?? "").trim()
    if (raw && raw.length > 3) mentioned.add(raw)
  }
  if (mentioned.size === 0) return ""

  const sections: string[] = []
  let totalChars = 0

  for (const mention of [...mentioned].slice(0, MAX_PROACTIVE_FILES * 2)) {
    if (sections.length >= MAX_PROACTIVE_FILES || totalChars >= MAX_PROACTIVE_CHARS) break

    // Try direct path first, then glob fallback for filename-only mentions
    const resolved = await resolveFileMention(mention, workdir)
    if (!resolved) continue

    try {
      const file = Bun.file(resolved)
      if (file.size > MAX_FILE_SIZE_BYTES) continue
      const content = await file.text()
      const excerpt = content.slice(0, MAX_SINGLE_FILE_CHARS)
      const relative = resolved.startsWith(workdir + "/") ? resolved.slice(workdir.length + 1) : resolved
      const truncNote = content.length > MAX_SINGLE_FILE_CHARS ? "\n... [truncated]" : ""
      const ext = relative.split(".").pop() ?? ""
      sections.push(`### ${relative}\n\`\`\`${ext}\n${excerpt}${truncNote}\n\`\`\``)
      totalChars += excerpt.length
    } catch { continue }
  }

  if (sections.length === 0) return ""
  return `## Files Referenced in Your Request\n\n${sections.join("\n\n")}`
}

async function resolveFileMention(mention: string, workdir: string): Promise<string | null> {
  // 1. Absolute path
  if (mention.startsWith("/")) {
    try { if ((await Bun.file(mention).exists())) return mention } catch {}
    return null
  }

  // 2. Relative path directly under workdir
  const direct = join(workdir, mention)
  try { if (await Bun.file(direct).exists()) return direct } catch {}

  // 3. Glob fallback — find by filename anywhere in project
  const filename = mention.split("/").pop() ?? mention
  try {
    const glob = new Bun.Glob("**/" + filename)
    for await (const found of glob.scan({ cwd: workdir, absolute: true })) {
      return found  // first match
    }
  } catch {}

  return null
}

// ─── Intent-based per-message skill injection ────────────────────────────────

/**
 * Kullanıcının mesajını analiz eder, ilgili skill'leri task tipine göre yükler
 * ve proactive section olarak döndürür. Proje tabanlı skill'lerle çakışmaz.
 */
export async function buildIntentSkillSection(
  userText: string,
  projectDir: string,
  existingSkillIds: Set<string> = new Set(),
): Promise<string> {
  if (!userText.trim()) return ""

  // Intent + error detection
  const intentIds = autoInvoker.checkMessage(userText)
  const errorIds  = autoInvoker.checkError(userText)
  const allIds    = [...new Set([...intentIds, ...errorIds])]
  if (allIds.length === 0) return ""

  // Proje tabanlı detection'da zaten olan skill'leri filtrele
  const newIds = allIds.filter((id) => !existingSkillIds.has(id))
  if (newIds.length === 0) return ""

  const defs = newIds
    .map((id) => SkillRegistry.get(id))
    .filter((d): d is SkillDef => d !== undefined)
  if (defs.length === 0) return ""

  const taskType = detectTaskType(userText)
  const loaded   = await Promise.all(defs.map((def) => loadSkillAdaptive(def, taskType)))

  // Token budget'a göre seç: önce priority (yüksek→düşük), eşitte küçük skill önce
  const selected: LoadedSkill[] = []
  let total = 0
  const prioritized = loaded
    .filter(s => s.systemPrompt)
    .sort((a, b) => {
      const pa = SkillRegistry.get(a.id)?.priority ?? 5
      const pb = SkillRegistry.get(b.id)?.priority ?? 5
      if (pb !== pa) return pb - pa          // yüksek öncelik önce
      return a.tokenCount - b.tokenCount     // eşit önceliklide küçük önce (daha fazlası sığsın)
    })
  for (const skill of prioritized) {
    if (total + skill.tokenCount > MAX_INTENT_SKILL_TOKENS) continue
    selected.push(skill)
    total += skill.tokenCount
  }
  if (selected.length === 0) return ""

  const labels = selected.map((s) => s.id).join(", ")
  const blocks  = selected
    .filter((s) => s.systemPrompt.length > 0)
    .map((s) => `## [${s.name.toUpperCase()}]\n${s.systemPrompt}`)

  return [
    `# Intent-Activated Skills [task:${taskType}] (${labels})`,
    blocks.join("\n\n---\n\n"),
  ].join("\n\n")
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

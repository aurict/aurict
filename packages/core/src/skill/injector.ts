import { detectSkills } from "./detector.js"
import { loadSkills, loadSkill, detectTaskType } from "./loader.js"
import { SkillRegistry } from "./registry.js"
import { autoInvoker, retrieveSkillIds } from "./auto-invoke.js"
import { skillScoreStore } from "./score-store.js"
import { loadSkillOverride, applyOverride } from "./override.js"
import { hooks } from "../hook/emitter.js"
import { countTokens } from "../provider/tokenizer.js"
import { MAIN_SYSTEM_PROMPT, PROMPT_MODULES, SUBAGENT_SYSTEM_PROMPT } from "../agent/system.js"
import type { AgentType } from "../agent/protocol.js"
import type { PromptModuleId } from "../agent/system.js"
import {
  dynamicPromptSection,
  joinPromptSections,
  resolvePromptSections,
  sessionPromptSection,
  staticPromptSection,
  type ResolvedPromptSection,
} from "../agent/prompt-sections.js"
import { memoryStore } from "../memory/store.js"
import { pinStore } from "../pin/store.js"
import { readArchitecture } from "../project-context/architecture.js"
import { readDecisions } from "../project-context/decisions.js"
import { diagnosticsStore } from "../diagnostics/store.js"
import { loadConfig } from "../config/config.js"
import { filterSkillDefsForSecurityCapability } from "../security/capability.js"
import { execSync } from "child_process"
import { join } from "node:path"
import { homedir } from "node:os"
import { readdirSync, existsSync, readFileSync } from "node:fs"
import type { LoadedSkill, SkillDef } from "./types.js"

export interface ActivatedSkillInfo {
  id: string
  name: string
  score?: number
  reasons: string[]
  source: "rule" | "retrieval" | "error"
}

const MAX_SKILL_TOKENS        = 8_000   // total token budget for all skills
const MAX_PROJECT_INSTRUCTIONS = 8_000  // character cap for CLAUDE.md / AGENTS.md content
const MAX_SKILL_LISTING_CHARS = 8_000   // discovery-only listing; full content is loaded via load_skill
const MAX_SKILL_DESCRIPTION_CHARS = 260

// ─── Multi-dir cache ──────────────────────────────────────────────────────────
interface CacheEntry { skills: LoadedSkill[]; expiresAt: number }
const cache = new Map<string, CacheEntry>()
interface DefCacheEntry { skills: SkillDef[]; expiresAt: number }
const defCache = new Map<string, DefCacheEntry>()
const CACHE_TTL_MS = 60_000  // 1 dakika sonra yeniden detect

export async function buildSystemPrompt(
  projectDir: string,
  base?: string,
  includeGit = false,
  agentType?: AgentType,
  userText = "",
): Promise<string> {
  return joinPromptSections(await buildSystemPromptSections(projectDir, base, includeGit, agentType, userText))
}

export async function buildSystemPromptSections(
  projectDir: string,
  base?: string,
  includeGit = false,
  agentType?: AgentType,
  userText = "",
): Promise<ResolvedPromptSection[]> {
  const basePrompt = agentType !== undefined ? SUBAGENT_SYSTEM_PROMPT : MAIN_SYSTEM_PROMPT
  const finalBase = [basePrompt, base].filter(Boolean).join("\n\n---\n\n")
  const systemSection = base
    ? dynamicPromptSection(`core_system:${agentType ?? "main"}:custom`, () => finalBase)
    : staticPromptSection(`core_system:${agentType ?? "main"}`, () => finalBase)

  // Order: project instructions → project context → core system → intent modules → pins → git → skills → memory
  return resolvePromptSections([
    sessionPromptSection("project_instructions", () => readProjectInstructions(projectDir)),
    sessionPromptSection("project_context", () => buildProjectContextSection(projectDir)),
    systemSection,
    dynamicPromptSection("intent_modules", () => buildPromptModuleSection(selectPromptModules(userText, agentType))),
    dynamicPromptSection("pins", () => pinStore.toPromptSection(projectDir)),
    dynamicPromptSection("git", () => includeGit ? buildGitSection(projectDir) : ""),
    dynamicPromptSection("skills", async () => {
      const skills = await getSkillDefsForProject(projectDir)
      return skills.length > 0 ? buildSkillDefSection(skills) : ""
    }),
    dynamicPromptSection("memory", () => buildMemorySection(projectDir)),
  ], projectDir)
}

const DOCUMENT_INTENT_RE = /\b(pdf|report|document|proposal|presentation|deck|slide|invoice|contract|whitepaper|brief|rapor|belge|dok[üu]man|sunum|teklif|fatura|s[öo]zle[sş]me)\b/i
const SPECIALIZED_SKILL_INTENT_RE = /\b(skill|template|legal|law|contract|agreement|proposal|pitch deck|financial model|marketing copy|business plan|hr|policy|resume|cover letter|domain-specific|uzman|hukuk|ik|pazarlama|i[sş] plan[ıi]|cv|[öo]zge[cç]mi[sş])\b/i
const MEMORY_INTENT_RE = /\b(remember|forget|memory|preference|prefer|always|never|akl[ıi]nda tut|haf[ıi]za|unut|tercih|her zaman|asla|bundan sonra)\b/i
const PROJECT_CONTEXT_INTENT_RE = /(?:\.aurict\b|\b(architecture|architectural|adr|decision record|system design|project context|tech stack|migration|migrate|refactor|restructure|redesign|stabilize|mimari|mimariye|karar|sistem tasar[ıi]m[ıi]|refakt[öo]r|yeniden yap[ıi]land[ıi]r|ge[cç]elim|ta[sş][ıi]|stabilize etmek)\b)/i
const PLANNING_INTENT_RE = /\b(plan|roadmap|multi-stage|large refactor|migration|architecture|redesign|stabilize|whole system|entire system|end-to-end|ba[sş]tan sona|t[üu]m sistem|b[üu]t[üu]n sistem|mimari|ge[cç]elim|kapsaml[ıi]|[cç]ok dosya|[cç]ok a[sş]ama)\b/i

export function selectPromptModules(userText: string, agentType?: AgentType): PromptModuleId[] {
  if (agentType !== undefined) return []

  const text = userText.trim()
  if (!text) return []

  const modules: PromptModuleId[] = []
  const add = (id: PromptModuleId) => {
    if (!modules.includes(id)) modules.push(id)
  }

  const wantsDocument = DOCUMENT_INTENT_RE.test(text)
  if (wantsDocument || SPECIALIZED_SKILL_INTENT_RE.test(text)) add("skillSelfLoading")
  if (wantsDocument) add("documentGeneration")
  if (MEMORY_INTENT_RE.test(text)) add("memoryInstructions")
  if (PROJECT_CONTEXT_INTENT_RE.test(text)) add("projectContextMaintenance")
  if (PLANNING_INTENT_RE.test(text)) add("planningTasks")

  return modules
}

function buildPromptModuleSection(moduleIds: PromptModuleId[]): string {
  if (moduleIds.length === 0) return ""

  const blocks = moduleIds.map((id) => PROMPT_MODULES[id].trim())
  return [
    `# Context-Specific Operating Modules (${moduleIds.join(", ")})`,
    blocks.join("\n\n"),
  ].join("\n\n")
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

function loadCustomSkillDefs(projectDir: string): SkillDef[] {
  const dirs = [
    join(homedir(), ".aurict", "skills"),
    join(projectDir, ".aurict", "skills"),
  ]
  const results: SkillDef[] = []

  for (const dir of dirs) {
    if (!existsSync(dir)) continue
    let files: string[]
    try { files = readdirSync(dir).filter(f => f.endsWith(".md")) } catch { continue }

    for (const file of files) {
      const id = `custom:${file.replace(/\.md$/, "")}`
      const def: SkillDef = {
        id,
        name: file.replace(/\.md$/, ""),
        description: `Custom skill: ${file.replace(/\.md$/, "")}`,
        detector: {},
        contentPath: join(dir, file),
        priority: 50,
        tags: ["custom"],
        requires: [],
      }
      const existing = results.findIndex(s => s.id === id)
      if (existing >= 0) results[existing] = def
      else results.push(def)
    }
  }

  return results
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
  const cfg = loadConfig(projectDir)
  const cacheKey = `${projectDir}:${cfg.securitySandbox?.enabled === true ? cfg.securitySandbox.profile ?? "active-lite" : "off"}`
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > now) return cached.skills

  const detected = filterSkillDefsForSecurityCapability(await detectSkills(projectDir), cfg)

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
  const custom = filterSkillDefsForSecurityCapability(await loadCustomSkills(projectDir), cfg)

  // Token bütçesine sığacak şekilde filtrele (önce yüksek öncelikli)
  const preSelected = selectWithinBudget([...loaded, ...custom])

  // Proje-bazlı skill override'larını uygula
  const selected = preSelected.map((skill) => {
    const override = loadSkillOverride(projectDir, skill.id)
    return override ? applyOverride(skill, override) : skill
  })

  // Usage kaydet (1dk cache'i nedeniyle session'da bir kez çalışır)
  skillScoreStore.recordInject(projectDir, selected.map((s) => s.id))

  cache.set(cacheKey, { skills: selected, expiresAt: now + CACHE_TTL_MS })
  return selected
}

export async function getSkillDefsForProject(projectDir: string): Promise<SkillDef[]> {
  const now = Date.now()
  const cfg = loadConfig(projectDir)
  const cacheKey = `${projectDir}:${cfg.securitySandbox?.enabled === true ? cfg.securitySandbox.profile ?? "active-lite" : "off"}`
  const cached = defCache.get(cacheKey)
  if (cached && cached.expiresAt > now) return cached.skills

  const detected = filterSkillDefsForSecurityCapability(await detectSkills(projectDir), cfg)
  const withDeps = resolveSkillDeps(detected)
  const boosted = withDeps.map((def) => {
    const boost = skillScoreStore.getBoost(projectDir, def.id)
    return boost !== 0 ? { ...def, priority: def.priority + boost } : def
  })
  const injected  = await hooks.emit("v1.context.inject", { skillIds: boosted.map((s) => s.id) })
  const finalIds  = new Set(injected.skillIds)
  const finalDefs = boosted.filter((s) => finalIds.has(s.id))
  const selected = selectSkillDefsWithinListingBudget(
    filterSkillDefsForSecurityCapability([...finalDefs, ...loadCustomSkillDefs(projectDir)], cfg)
  )
  defCache.set(cacheKey, { skills: selected, expiresAt: now + CACHE_TTL_MS })
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
  defCache.clear()
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
  const cfg = loadConfig(projectDir)

  // Intent + error detection + metadata retrieval
  const intentIds = autoInvoker.checkMessage(userText)
  const errorIds  = autoInvoker.checkError(userText)
  const retrieval = retrieveSkillIds(userText, buildSkillSearchDocs())
  const allIds    = [...new Set([...intentIds, ...errorIds, ...retrieval.map((m) => m.id)])]
  if (allIds.length === 0) return ""

  // Proje tabanlı detection'da zaten olan skill'leri filtrele
  const newIds = allIds.filter((id) => !existingSkillIds.has(id))
  if (newIds.length === 0) return ""

  const defs = newIds
    .map((id) => SkillRegistry.get(id))
    .filter((d): d is SkillDef => d !== undefined)
    .filter((d) => filterSkillDefsForSecurityCapability([d], cfg).length > 0)
  if (defs.length === 0) return ""

  const taskType = detectTaskType(userText)
  const selected = selectSkillDefsWithinListingBudget(defs)
  if (selected.length === 0) return ""

  const labels = selected.map((s) => s.id).join(", ")

  return [
    `# Intent-Matched Skills [task:${taskType}] (${labels})`,
    "These are metadata matches only. If one applies, call load_skill before performing the specialized work.",
    "",
    selected.map(formatSkillListingLine).join("\n"),
  ].join("\n\n")
}

export function matchIntentSkills(
  userText: string,
  projectDirOrExistingSkillIds: string | Set<string> = new Set(),
  existingSkillIds: Set<string> = new Set(),
): ActivatedSkillInfo[] {
  if (!userText.trim()) return []
  const projectDir = typeof projectDirOrExistingSkillIds === "string" ? projectDirOrExistingSkillIds : undefined
  const existingIds = typeof projectDirOrExistingSkillIds === "string" ? existingSkillIds : projectDirOrExistingSkillIds
  const cfg = projectDir ? loadConfig(projectDir) : {}

  const retrieval = retrieveSkillIds(userText, buildSkillSearchDocs())
  const retrievalById = new Map(retrieval.map((match) => [match.id, match]))
  const intentIds = autoInvoker.checkMessage(userText)
  const errorIds = autoInvoker.checkError(userText)
  const ids = [...new Set([...intentIds, ...errorIds, ...retrieval.map((match) => match.id)])]
    .filter((id) => !existingIds.has(id))

  return ids
    .map((id) => {
      const def = SkillRegistry.get(id)
      if (!def) return null
      if (!filterSkillDefsForSecurityCapability([def], cfg).length) return null
      const retrieved = retrievalById.get(id)
      const source: ActivatedSkillInfo["source"] = errorIds.includes(id)
        ? "error"
        : intentIds.includes(id)
          ? "rule"
          : "retrieval"
      return {
        id,
        name: def.name || id,
        ...(retrieved ? { score: retrieved.score } : {}),
        reasons: retrieved?.reasons ?? (source === "rule" ? ["intent rule"] : ["error rule"]),
        source,
      }
    })
    .filter((info): info is ActivatedSkillInfo => info !== null)
}

function buildSkillSearchDocs() {
  return SkillRegistry.all().map((skill) => {
    const detectorText = [
      ...(skill.detector.files ?? []),
      ...(skill.detector.deps ?? []),
      ...(skill.detector.dirs ?? []),
      ...(skill.detector.patterns ?? []),
      ...(skill.detector.keywords ?? []),
    ].join(" ")
    return {
      id: skill.id,
      priority: skill.priority,
      text: [
        skill.id,
        skill.name,
        skill.description,
        skill.tags.join(" "),
        skill.agent ?? "",
        detectorText,
      ].filter(Boolean).join(" "),
    }
  })
}

// ─── Token bütçesi ile skill seçimi ──────────────────────────────────────────

function selectSkillDefsWithinListingBudget(skills: SkillDef[]): SkillDef[] {
  const selected: SkillDef[] = []
  let chars = 0
  const sorted = [...skills].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority
    return a.id.localeCompare(b.id)
  })

  for (const skill of sorted) {
    const line = formatSkillListingLine(skill)
    if (chars + line.length > MAX_SKILL_LISTING_CHARS) continue
    selected.push(skill)
    chars += line.length + 1
  }
  return selected
}

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

function buildSkillDefSection(skills: SkillDef[]): string {
  if (skills.length === 0) return ""
  return [
    `# Available Skills (${skills.length})`,
    "These are discovery entries only. Full instructions are intentionally not preloaded.",
    "If a skill matches the user's task, call load_skill with the skill ID before doing specialized work.",
    "",
    skills.map(formatSkillListingLine).join("\n"),
  ].join("\n")
}

function formatSkillListingLine(skill: Pick<SkillDef, "id" | "name" | "description" | "tags" | "whenToUse" | "allowedTools" | "executionContext" | "model" | "effort" | "disableModelInvocation" | "userInvocable">): string {
  const desc = truncateSkillDescription(skill.whenToUse || skill.description || skill.name)
  const policy = [
    skill.executionContext ? `context=${skill.executionContext}` : "",
    skill.model ? `model=${skill.model}` : "",
    skill.effort ? `effort=${skill.effort}` : "",
    skill.allowedTools?.length ? `tools=${skill.allowedTools.join(",")}` : "",
    skill.disableModelInvocation ? "model-invocation=disabled" : "",
    skill.userInvocable === false ? "hidden" : "",
  ].filter(Boolean).join("; ")
  const tags = skill.tags.length ? ` tags=${skill.tags.join(",")}` : ""
  return `- ${skill.id}: ${desc}${tags}${policy ? ` (${policy})` : ""}`
}

function truncateSkillDescription(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim()
  if (normalized.length <= MAX_SKILL_DESCRIPTION_CHARS) return normalized
  return `${normalized.slice(0, MAX_SKILL_DESCRIPTION_CHARS - 1)}…`
}

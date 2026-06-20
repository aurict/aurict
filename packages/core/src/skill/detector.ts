import { readFileSync, statSync } from "fs"
import { join } from "path"
import { SkillRegistry } from "./registry.js"
import type { SkillDef, SkillMatch } from "./types.js"

const MIN_CONFIDENCE   = 0.35
const MAX_SKILLS       = 15
const IGNORE_DIRS      = new Set(["node_modules", ".git", ".next", "dist", "build", ".cache", ".turbo", "coverage"])
const MAX_SCAN_FILES   = 3_000

// ─── Hash-based cache: proje değişmeden tekrar tarama yapılmaz ───────────────
interface CacheEntry { hash: string; skills: SkillDef[] }
const cache = new Map<string, CacheEntry>()

function projectHash(dir: string): string {
  // package.json + birkaç lock dosyasının mtime'ını birleştir
  const candidates = ["package.json", "go.mod", "Cargo.toml", "requirements.txt", "pyproject.toml", "composer.json", "bun.lockb", "pnpm-lock.yaml"]
  const parts: string[] = []
  for (const f of candidates) {
    try { parts.push(String(statSync(join(dir, f)).mtimeMs)) } catch { /* yok */ }
  }
  return parts.join("|") || String(Date.now())
}

export async function detectSkills(projectDir: string): Promise<SkillDef[]> {
  const hash = projectHash(projectDir)
  const hit  = cache.get(projectDir)
  if (hit && hit.hash === hash) return hit.skills

  const [allDeps, filePaths] = await Promise.all([
    readAllDeps(projectDir),
    scanPaths(projectDir),
  ])

  const matches = scoreAll(allDeps, filePaths)
  const result  = matches
    .filter((m) => m.confidence >= MIN_CONFIDENCE)
    .sort((a, b) => b.confidence - a.confidence || b.skill.priority - a.skill.priority)
    .slice(0, MAX_SKILLS)
    .map((m) => m.skill)

  cache.set(projectDir, { hash, skills: result })
  return result
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function scoreAll(deps: Set<string>, paths: string[]): SkillMatch[] {
  const results: SkillMatch[] = []

  for (const skill of SkillRegistry.all()) {
    // content-ops skill'leri proje tespitinden muaf — sadece intent ile tetiklenir
    if (skill.agent === "content-ops") continue
    const { score, reasons } = scoreSkill(skill, deps, paths)
    if (score > 0) {
      results.push({ skill, confidence: Math.min(score, 1), reasons })
    }
  }

  return results
}

function scoreSkill(skill: SkillDef, deps: Set<string>, paths: string[]): { score: number; reasons: string[] } {
  const d       = skill.detector
  const reasons: string[] = []
  let score     = 0

  // Dep eşleşmesi — en güvenilir sinyal (0.6/dep)
  for (const dep of d.deps ?? []) {
    if (deps.has(dep) || [...deps].some((k) => k.startsWith(dep))) {
      reasons.push(`dep:${dep}`)
      score += 0.6
    }
  }

  // Dosya adı — yüksek güven (0.5/file)
  for (const file of d.files ?? []) {
    if (paths.some((p) => p === file || p.endsWith(`/${file}`))) {
      reasons.push(`file:${file}`)
      score += 0.5
    }
  }

  // Dizin varlığı — orta güven (0.35/dir)
  for (const dirPat of d.dirs ?? []) {
    if (paths.some((p) => p.startsWith(dirPat) || p.includes(`/${dirPat}`))) {
      reasons.push(`dir:${dirPat}`)
      score += 0.35
    }
  }

  // Uzantı / pattern — düşük güven ama birden fazla eklenir (0.15/match, max 0.3)
  let patternHits = 0
  for (const pat of d.patterns ?? []) {
    if (paths.some((p) => p.endsWith(pat) || p.includes(pat))) {
      reasons.push(`ext:${pat}`)
      score     += 0.15
      patternHits++
      if (patternHits >= 2) break
    }
  }

  return { score, reasons }
}

// ─── Multi-language dep reader ────────────────────────────────────────────────

async function readAllDeps(dir: string): Promise<Set<string>> {
  const deps = new Set<string>()

  // Node.js / Bun
  try {
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as Record<string, unknown>
    const all  = { ...(pkg["dependencies"] as Record<string, string> ?? {}), ...(pkg["devDependencies"] as Record<string, string> ?? {}) }
    for (const k of Object.keys(all)) deps.add(k)
  } catch { /* no package.json */ }

  // Go
  try {
    const mod = readFileSync(join(dir, "go.mod"), "utf8")
    for (const match of mod.matchAll(/^\s+([^\s]+)\s+v/gm)) {
      deps.add(match[1]!)
    }
    deps.add("go")
  } catch { /* no go.mod */ }

  // Python
  try {
    const req = readFileSync(join(dir, "requirements.txt"), "utf8")
    for (const line of req.split("\n")) {
      const pkg = line.trim().split(/[>=<!]/)[0]?.trim()
      if (pkg) deps.add(pkg.toLowerCase())
    }
    deps.add("python")
  } catch { /* no requirements.txt */ }

  try {
    const pyp = readFileSync(join(dir, "pyproject.toml"), "utf8")
    deps.add("python")
    for (const match of pyp.matchAll(/"([^"]+)>=?/g)) deps.add(match[1]!.toLowerCase())
  } catch { /* no pyproject.toml */ }

  // Rust
  try {
    const cargo = readFileSync(join(dir, "Cargo.toml"), "utf8")
    deps.add("rust")
    for (const match of cargo.matchAll(/^(\w[\w-]+)\s*=/gm)) deps.add(match[1]!)
  } catch { /* no Cargo.toml */ }

  // PHP
  try {
    const comp = JSON.parse(readFileSync(join(dir, "composer.json"), "utf8")) as Record<string, unknown>
    const all  = { ...(comp["require"] as Record<string, string> ?? {}), ...(comp["require-dev"] as Record<string, string> ?? {}) }
    for (const k of Object.keys(all)) deps.add(k)
    deps.add("php")
  } catch { /* no composer.json */ }

  // Swift
  try {
    readFileSync(join(dir, "Package.swift"), "utf8")
    deps.add("swift")
  } catch { /* no Package.swift */ }

  return deps
}

// ─── Path scanner ─────────────────────────────────────────────────────────────

async function scanPaths(dir: string): Promise<string[]> {
  const paths: string[] = []
  const glob = new Bun.Glob("**/*")

  try {
    for await (const file of glob.scan({ cwd: dir, absolute: false })) {
      const top = file.split("/")[0]!
      if (IGNORE_DIRS.has(top)) continue
      paths.push(file)
      if (paths.length >= MAX_SCAN_FILES) break
    }
  } catch { /* ignore */ }

  return paths
}

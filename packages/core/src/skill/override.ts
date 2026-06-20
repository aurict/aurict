import { join } from "node:path"
import { existsSync, readFileSync } from "node:fs"
import { countTokens } from "../provider/tokenizer.js"
import type { LoadedSkill } from "./types.js"

export interface SkillOverride {
  add:      string    // `.aurict/skill-overrides/<id>.md` ## ADD section'ından gelen içerik
  suppress: string[]  // ## SUPPRESS section — bu anahtar kelimeleri içeren section'lar inject edilmez
}

/** `.aurict/skill-overrides/<skillId>.md` dosyasını okur ve parse eder */
export function loadSkillOverride(workdir: string, skillId: string): SkillOverride | null {
  const path = join(workdir, ".aurict", "skill-overrides", `${skillId}.md`)
  if (!existsSync(path)) return null
  try {
    return parseOverride(readFileSync(path, "utf8"))
  } catch { return null }
}

function parseOverride(content: string): SkillOverride {
  const lines   = content.split("\n")
  const addLines: string[]     = []
  const suppress: string[]     = []
  let   section: "add" | "suppress" | null = null

  for (const line of lines) {
    if (/^##\s+ADD\b/i.test(line))      { section = "add";      continue }
    if (/^##\s+SUPPRESS\b/i.test(line)) { section = "suppress"; continue }
    if (/^##/.test(line))               { section = null;        continue }
    if (section === "add")      addLines.push(line)
    if (section === "suppress") {
      const item = line.replace(/^[-*]\s*/, "").trim()
      if (item) suppress.push(item.toLowerCase())
    }
  }

  return { add: addLines.join("\n").trim(), suppress }
}

/**
 * Yüklü skill üzerine proje-bazlı override uygular.
 * - suppress: o anahtar kelimeyi başlığında içeren paragrafları çıkarır
 * - add: systemPrompt'a "Project rules" bölümü olarak ekler
 */
export function applyOverride(skill: LoadedSkill, override: SkillOverride): LoadedSkill {
  let prompt = skill.systemPrompt

  // Suppress: başlığında o kelimeyi içeren blokları kaldır
  for (const keyword of override.suppress) {
    const re = new RegExp(
      `(?:^|\\n)(#{1,3}\\s[^\\n]*${escapeRegex(keyword)}[^\\n]*)\\n[\\s\\S]*?(?=\\n#{1,3}\\s|$)`,
      "gi"
    )
    prompt = prompt.replace(re, "")
  }

  // Add: proje-spesifik kural olarak ekle
  if (override.add) {
    prompt = `${prompt.trim()}\n\n**Project overrides:**\n${override.add}`
  }

  prompt = prompt.trim()
  return { ...skill, systemPrompt: prompt, tokenCount: countTokens(prompt) }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Instant Context Display
 * 
 * Kullanıcı mesajı yazarken ilgili context'i otomatik gösterir:
 * - Dosya referansları tespit edildi → dosya içeriğini göster
 * - Skill tetikleyici kelime → ilgili skill'i göster
 * - Hata mesajı → ilgili error pattern'ı göster
 */

import { readFile } from "fs/promises"
import { resolve, basename } from "path"
import { readdir } from "fs/promises"

export interface InstantContextResult {
  files: Array<{ path: string; preview: string }>
  skills: string[]
  errorPatterns: string[]
  suggestions: string[]
}

export interface InstantContextConfig {
  maxFiles: number
  maxPreviewChars: number
  maxSkills: number
  enabled: boolean
}

const DEFAULT_CONFIG: InstantContextConfig = {
  maxFiles: 3,
  maxPreviewChars: 500,
  maxSkills: 2,
  enabled: true,
}

/**
 * Kullanıcı mesajından instant context çıkarır.
 */
export async function extractInstantContext(
  message: string,
  workdir: string,
  config: Partial<InstantContextConfig> = {},
): Promise<InstantContextResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config }

  if (!cfg.enabled) {
    return { files: [], skills: [], errorPatterns: [], suggestions: [] }
  }

  const result: InstantContextResult = {
    files: [],
    skills: [],
    errorPatterns: [],
    suggestions: [],
  }

  // 1. Dosya referansları tespit et
  const filePaths = extractFilePaths(message)
  for (const filePath of filePaths.slice(0, cfg.maxFiles)) {
    const preview = await getFilePreview(filePath, workdir, cfg.maxPreviewChars)
    if (preview) {
      result.files.push({ path: filePath, preview })
    }
  }

  // 2. Skill tetikleyici kelimeler
  result.skills = extractSkillTriggers(message).slice(0, cfg.maxSkills)

  // 3. Hata mesajı pattern'ları
  result.errorPatterns = extractErrorPatterns(message)

  // 4. Öneriler
  result.suggestions = generateSuggestions(message, result)

  return result
}

/**
 * Mesajdan dosya yollarını çıkarır.
 */
function extractFilePaths(message: string): string[] {
  const paths: string[] = []
  
  // Yaygın dosya uzantıları
  const extensions = ["ts", "tsx", "js", "jsx", "py", "go", "rs", "md", "json", "yaml", "yml"]
  const pattern = new RegExp(
    `(?:^|\\s|["'\`(])((?:\\.{0,2}/)?[\\w.-]+(?:/[\\w.-]+)*)\\.(${extensions.join("|")})`,
    "g"
  )

  let match
  while ((match = pattern.exec(message)) !== null) {
    const path = match[1] + "." + match[2]
    if (path && !paths.includes(path)) {
      paths.push(path)
    }
  }

  return paths
}

/**
 * Dosya önizlemesi alır.
 */
async function getFilePreview(
  filePath: string,
  workdir: string,
  maxChars: number,
): Promise<string | null> {
  try {
    const absPath = resolve(workdir, filePath)
    const content = await readFile(absPath, "utf-8")
    
    // İlk N karakter
    const preview = content.slice(0, maxChars)
    
    // Eğer dosya daha uzunsa "..." ekle
    if (content.length > maxChars) {
      return preview + "\n... (truncated)"
    }
    
    return preview
  } catch {
    return null
  }
}

/**
 * Skill tetikleyici kelimeleri tespit eder.
 */
function extractSkillTriggers(message: string): string[] {
  const skills: string[] = []
  const lower = message.toLowerCase()

  // Skill → keyword mapping
  const skillKeywords: Record<string, string[]> = {
    "react-expert": ["react", "component", "hook", "jsx", "tsx"],
    "nextjs-expert": ["next.js", "nextjs", "app router", "server component"],
    "typescript-expert": ["typescript", "type error", "interface", "generic"],
    "testing-patterns": ["test", "jest", "vitest", "playwright", "coverage"],
    "security-review": ["security", "vulnerability", "auth", "xss", "injection"],
    "performance": ["performance", "slow", "optimize", "bundle", "lighthouse"],
    "docker-patterns": ["docker", "container", "dockerfile"],
    "prisma-expert": ["prisma", "schema", "migration", "orm"],
  }

  for (const [skill, keywords] of Object.entries(skillKeywords)) {
    if (keywords.some(kw => lower.includes(kw))) {
      skills.push(skill)
    }
  }

  return skills
}

/**
 * Hata mesajı pattern'larını tespit eder.
 */
function extractErrorPatterns(message: string): string[] {
  const patterns: string[] = []
  
  // TypeScript hataları
  if (/error ts\d+|type error|property.*does not exist/i.test(message)) {
    patterns.push("TypeScript error detected")
  }

  // Module not found
  if (/cannot find module|module not found/i.test(message)) {
    patterns.push("Module resolution error")
  }

  // Runtime hataları
  if (/undefined is not|cannot read property|is not a function/i.test(message)) {
    patterns.push("Runtime error detected")
  }

  // Network hataları
  if (/econnrefused|etimedout|network error/i.test(message)) {
    patterns.push("Network error detected")
  }

  return patterns
}

/**
 * Bağlama göre öneriler üretir.
 */
function generateSuggestions(
  message: string,
  context: InstantContextResult,
): string[] {
  const suggestions: string[] = []

  // Dosya referansı varsa
  if (context.files.length > 0) {
    suggestions.push(`[FILE] ${context.files.length} dosya referansi tespit edildi`)
  }

  // Skill tetikleyici varsa
  if (context.skills.length > 0) {
    suggestions.push(`[SKILL] Ilgili skill'ler: ${context.skills.join(", ")}`)
  }

  // Hata pattern'i varsa
  if (context.errorPatterns.length > 0) {
    suggestions.push(`[WARN] ${context.errorPatterns.join(", ")}`)
  }

  return suggestions
}

/**
 * Formatlanmış instant context döner (TUI için).
 */
export function formatInstantContext(context: InstantContextResult): string {
  const parts: string[] = []

  if (context.files.length > 0) {
    parts.push("\n[Detected Files]")
    for (const file of context.files) {
      parts.push(`  [FILE] ${file.path}`)
    }
  }

  if (context.skills.length > 0) {
    parts.push("\n[Relevant Skills]")
    for (const skill of context.skills) {
      parts.push(`  [SKILL] ${skill}`)
    }
  }

  if (context.errorPatterns.length > 0) {
    parts.push("\n[Error Patterns]")
    for (const pattern of context.errorPatterns) {
      parts.push(`  [WARN] ${pattern}`)
    }
  }

  if (context.suggestions.length > 0) {
    parts.push("\n[Suggestions]")
    for (const suggestion of context.suggestions) {
      parts.push(`  ${suggestion}`)
    }
  }

  return parts.join("\n")
}

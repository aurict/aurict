import { relative, resolve } from "node:path"
import { clearPromptSectionCache } from "./prompt-sections.js"

export function invalidatePromptSectionsForChangedFile(workdir: string, filePath: string): void {
  const relPath = normalizeChangedPath(workdir, filePath)
  if (!relPath) return

  if (
    relPath === "AGENTS.md" ||
    relPath === "CLAUDE.md" ||
    relPath === ".claude/CLAUDE.md"
  ) {
    clearPromptSectionCache({ cacheKey: workdir, name: "project_instructions" })
  }

  if (relPath.startsWith(".aurict/")) {
    clearPromptSectionCache({ cacheKey: workdir, name: "project_context" })
  }

  if (relPath.startsWith(".aurict/skills/") || relPath.startsWith(".aurict/skill-overrides/")) {
    clearPromptSectionCache({ cacheKey: workdir, name: "skills" })
  }
}

export function changedFileAffectsSkillCache(workdir: string, filePath: string): boolean {
  const relPath = normalizeChangedPath(workdir, filePath)
  return !!relPath && (relPath.startsWith(".aurict/skills/") || relPath.startsWith(".aurict/skill-overrides/"))
}

function normalizeChangedPath(workdir: string, filePath: string): string | null {
  const absWorkdir = resolve(workdir)
  const absPath = resolve(absWorkdir, filePath)
  const relPath = relative(absWorkdir, absPath).replace(/\\/g, "/")

  if (!relPath || relPath === "." || relPath.startsWith("../") || relPath === "..") {
    return null
  }

  return relPath
}

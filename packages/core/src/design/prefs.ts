import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"

const PREFS_FILE = join(homedir(), ".aurict", "design-prefs.json")

export interface DesignPrefs {
  lastSystemId?:    string
  lastSkillId?:     string
  favoriteSystemIds: string[]
  favoriteSkillIds:  string[]
  recentSystemIds:   string[]   // last 5 used, most recent first
}

function defaults(): DesignPrefs {
  return { favoriteSystemIds: [], favoriteSkillIds: [], recentSystemIds: [] }
}

export function loadDesignPrefs(): DesignPrefs {
  try {
    const raw = readFileSync(PREFS_FILE, "utf8")
    return { ...defaults(), ...(JSON.parse(raw) as Partial<DesignPrefs>) }
  } catch {
    return defaults()
  }
}

export function saveDesignPrefs(prefs: DesignPrefs): void {
  try {
    mkdirSync(join(homedir(), ".aurict"), { recursive: true })
    writeFileSync(PREFS_FILE, JSON.stringify(prefs, null, 2), "utf8")
  } catch { /* non-fatal */ }
}

export function recordSystemUsed(systemId: string): void {
  const prefs = loadDesignPrefs()
  prefs.lastSystemId   = systemId
  prefs.recentSystemIds = [systemId, ...prefs.recentSystemIds.filter(id => id !== systemId)].slice(0, 5)
  saveDesignPrefs(prefs)
}

export function recordSkillUsed(skillId: string): void {
  const prefs = loadDesignPrefs()
  prefs.lastSkillId = skillId
  saveDesignPrefs(prefs)
}

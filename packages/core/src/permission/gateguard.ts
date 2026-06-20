import { appendFileSync, readFileSync, mkdirSync } from "node:fs"
import { join, basename } from "node:path"

export interface GateRule { pattern: string; action: "allow" | "ask" | "deny" }

export interface AuditEntry {
  ts:      number
  tool:    string
  path:    string
  action:  string
  allowed: boolean
}

const DEFAULT_PROTECTED: GateRule[] = [
  { pattern: ".env",            action: "ask" },
  { pattern: ".env.*",          action: "ask" },
  { pattern: "*.lock",          action: "ask" },
  { pattern: "tsconfig.json",   action: "ask" },
  { pattern: "tsconfig.*.json", action: "ask" },
  { pattern: "package.json",    action: "ask" },
  { pattern: ".git/*",          action: "deny" },
  // Aurict internal data — subagents must not corrupt session DB, companion state, config, stash, etc.
  { pattern: ".aurict/*",      action: "deny" },
]

function matchPattern(pattern: string, filePath: string): boolean {
  const name = basename(filePath)
  const full = filePath.replace(/\\/g, "/")

  if (pattern === "*") return true

  // .git/* — glob prefix
  if (pattern.endsWith("/*")) {
    const prefix = pattern.slice(0, -2)
    if (full.includes(`/${prefix}/`) || full.includes(`\\${prefix}\\`)) return true
  }

  // Wildcard in name (e.g. .env.*, tsconfig.*.json)
  if (pattern.includes("*")) {
    const re = new RegExp(
      "^" + pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$",
    )
    return re.test(name) || re.test(full)
  }

  return name === pattern || full.endsWith("/" + pattern)
}

class GateGuard {
  private customRules: GateRule[] = []
  private projectDir: string | null = null

  setProjectDir(dir: string): void {
    this.projectDir = dir
    this.loadProjectRules(dir)
  }

  private loadProjectRules(dir: string): void {
    try {
      const configPath = join(dir, ".aurict", "protected.json")
      const rules = JSON.parse(readFileSync(configPath, "utf8")) as GateRule[]
      this.customRules = [...rules]
    } catch { /* no project config */ }
  }

  check(filePath: string): "allow" | "ask" | "deny" {
    const allRules = [...DEFAULT_PROTECTED, ...this.customRules]
    let result: "allow" | "ask" | "deny" = "allow"

    for (const rule of allRules) {
      if (matchPattern(rule.pattern, filePath)) {
        result = rule.action
      }
    }

    return result
  }

  addRule(rule: GateRule): void {
    const idx = this.customRules.findIndex((r) => r.pattern === rule.pattern)
    if (idx !== -1) {
      this.customRules[idx] = rule
    } else {
      this.customRules.push(rule)
    }
  }

  removePattern(pattern: string): void {
    this.customRules = this.customRules.filter((r) => r.pattern !== pattern)
  }

  clearCustomRules(): void {
    this.customRules = []
  }

  listRules(): GateRule[] {
    return [...DEFAULT_PROTECTED, ...this.customRules]
  }

  audit(entry: AuditEntry): void {
    const dir = this.projectDir
      ? join(this.projectDir, ".aurict")
      : join(process.cwd(), ".aurict")
    try {
      mkdirSync(dir, { recursive: true })
      appendFileSync(join(dir, "audit.log"), JSON.stringify(entry) + "\n", "utf8")
    } catch { /* ignore audit failures */ }
  }
}

export const gateGuard = new GateGuard()

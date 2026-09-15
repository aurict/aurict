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
  private projectDir: string | null = null
  private rulesByProject = new Map<string, GateRule[]>()

  setProjectDir(dir: string): void {
    this.projectDir = dir
    this.rulesFor(dir)
  }

  private rulesFor(dir?: string | null): GateRule[] {
    const key = dir ?? "__global__"
    const cached = this.rulesByProject.get(key)
    if (cached) return cached
    if (!dir) {
      const rules: GateRule[] = []
      this.rulesByProject.set(key, rules)
      return rules
    }
    try {
      const configPath = join(dir, ".aurict", "protected.json")
      const rules = JSON.parse(readFileSync(configPath, "utf8")) as GateRule[]
      this.rulesByProject.set(key, [...rules])
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (code !== "ENOENT") console.warn(`[aurict] invalid GateGuard config for ${dir}`, error)
      this.rulesByProject.set(key, [])
    }
    return this.rulesByProject.get(key)!
  }

  check(filePath: string, projectDir: string | null = this.projectDir): "allow" | "ask" | "deny" {
    const allRules = [...DEFAULT_PROTECTED, ...this.rulesFor(projectDir)]
    let result: "allow" | "ask" | "deny" = "allow"

    for (const rule of allRules) {
      if (matchPattern(rule.pattern, filePath)) {
        result = rule.action
      }
    }

    return result
  }

  addRule(rule: GateRule): void {
    const customRules = this.rulesFor(this.projectDir)
    const idx = customRules.findIndex((r) => r.pattern === rule.pattern)
    if (idx !== -1) {
      customRules[idx] = rule
    } else {
      customRules.push(rule)
    }
  }

  removePattern(pattern: string): void {
    const key = this.projectDir ?? "__global__"
    this.rulesByProject.set(key, this.rulesFor(this.projectDir).filter((r) => r.pattern !== pattern))
  }

  clearCustomRules(): void {
    this.rulesByProject.set(this.projectDir ?? "__global__", [])
  }

  listRules(): GateRule[] {
    return [...DEFAULT_PROTECTED, ...this.rulesFor(this.projectDir)]
  }

  audit(entry: AuditEntry, projectDir: string | null = this.projectDir): void {
    const dir = projectDir
      ? join(projectDir, ".aurict")
      : join(process.cwd(), ".aurict")
    try {
      mkdirSync(dir, { recursive: true })
      appendFileSync(join(dir, "audit.log"), JSON.stringify(entry) + "\n", "utf8")
    } catch (error) {
      throw new Error(`Failed to write GateGuard audit log at ${dir}`, { cause: error })
    }
  }
}

export const gateGuard = new GateGuard()

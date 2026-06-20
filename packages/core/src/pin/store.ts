import { join } from "path"
import { homedir } from "os"
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs"

export interface Pin {
  id:        string
  content:   string
  scope:     "global" | "project"
  project?:  string   // workdir — sadece project scope için
  createdAt: number
}

function globalPath(): string {
  return join(homedir(), ".aurict", "pins.json")
}

function load(): Pin[] {
  try {
    const p = globalPath()
    if (!existsSync(p)) return []
    return JSON.parse(readFileSync(p, "utf8")) as Pin[]
  } catch { return [] }
}

function save(pins: Pin[]): void {
  const p = globalPath()
  mkdirSync(join(homedir(), ".aurict"), { recursive: true })
  writeFileSync(p, JSON.stringify(pins, null, 2), "utf8")
}

export const pinStore = {
  add(content: string, scope: "global" | "project" = "project", project?: string): Pin {
    const pins = load()
    const pin: Pin = {
      id:        crypto.randomUUID().slice(0, 8),
      content,
      scope,
      createdAt: Date.now(),
      ...(scope === "project" && project ? { project } : {}),
    }
    save([...pins, pin])
    return pin
  },

  remove(id: string): boolean {
    const pins = load()
    const next = pins.filter((p) => p.id !== id)
    if (next.length === pins.length) return false
    save(next)
    return true
  },

  list(workdir?: string): Pin[] {
    const pins = load()
    return pins.filter((p) =>
      p.scope === "global" ||
      (p.scope === "project" && (!p.project || p.project === workdir))
    )
  },

  toPromptSection(workdir?: string): string {
    const pins = this.list(workdir)
    if (!pins.length) return ""
    const lines = pins.map((p) => `- ${p.content}`)
    return `## Pinned Context\n${lines.join("\n")}`
  },
}

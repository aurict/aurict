export interface SkillFrontmatter {
  name:          string
  description:   string
  triggers: {
    extensions?: string[]
    directories?: string[]
    filenames?:  string[]
    keywords?:   string[]
    deps?:       string[]
  }
  auto_load_when?: string
  agent?:          string
  tools?:          string[]
  "allowed-tools"?: string[] | string
  when_to_use?:    string
  context?:        "inline" | "fork" | string
  model?:          string
  effort?:         string
  "disable-model-invocation"?: boolean | string
  "user-invocable"?: boolean | string
  priority?:       number
  tags?:           string[]
}

export function parseFrontmatter(raw: string): { meta: SkillFrontmatter; body: string } {
  const empty: SkillFrontmatter = { name: "", description: "", triggers: {} }

  if (!raw.startsWith("---")) return { meta: empty, body: raw }

  const end = raw.indexOf("\n---", 4)
  if (end < 0) return { meta: empty, body: raw }

  const yaml = raw.slice(4, end)
  const body = raw.slice(end + 4).trim()
  const meta = parseYaml(yaml) as unknown as SkillFrontmatter

  return { meta, body }
}

// ─── Minimal YAML parser (SKILL.md formatına özel) ───────────────────────────

function parseYaml(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const lines = yaml.split("\n")
  let i = 0

  while (i < lines.length) {
    const line = lines[i]!
    if (!line.trim() || line.trim().startsWith("#")) { i++; continue }

    const match = line.match(/^([\w-]+):\s*(.*)$/)
    if (!match) { i++; continue }

    const key   = match[1]!
    const value = match[2]!.trim()

    if (value.startsWith("[") && value.endsWith("]")) {
      result[key] = parseInlineArray(value)
      i++
    } else if (!value) {
      // nested object veya array
      const [nested, consumed] = parseNested(lines, i + 1)
      result[key] = nested
      i += consumed + 1
    } else {
      result[key] = value.replace(/^["']|["']$/g, "")
      i++
    }
  }

  return result
}

function parseNested(lines: string[], start: number): [unknown, number] {
  const arr: string[]            = []
  const obj: Record<string, unknown> = {}
  let count = 0

  while (start + count < lines.length) {
    const line = lines[start + count]!
    if (!line.match(/^(\s|\t)/)) break

    const trimmed = line.trim()
    if (trimmed.startsWith("- ")) {
      arr.push(trimmed.slice(2).trim().replace(/^["']|["']$/g, ""))
    } else {
      const m = trimmed.match(/^([\w-]+):\s*(.*)$/)
      if (m) {
        const v = m[2]!.trim()
        obj[m[1]!] = v.startsWith("[") ? parseInlineArray(v) : v.replace(/^["']|["']$/g, "")
      }
    }
    count++
  }

  return arr.length > 0 ? [arr, count] : [obj, count]
}

function parseInlineArray(s: string): string[] {
  const inner = s.replace(/^\[|\]$/g, "").trim()
  if (!inner) return []
  return inner.split(",").map((item) => item.trim().replace(/^["']|["']$/g, ""))
}

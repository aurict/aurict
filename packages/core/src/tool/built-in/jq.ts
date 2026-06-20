import { z } from "zod"
import type { ToolDef, ExecuteResult } from "../types.js"

export const jqTool: ToolDef = {
  id: "jq",
  description: `Query and transform JSON data using jq syntax.

Uses system jq binary when available, falls back to built-in JSONPath engine.

COMMON PATTERNS:
  .                          → identity (pretty-print)
  .key                       → field access
  .key.nested                → nested field
  .[0]                       → array index
  .[]                        → all array elements
  .[] | .name                → pluck field from each element
  [.[] | select(.age > 18)]  → filter array
  .[] | {name, age}          → reshape objects
  keys, values, length       → object/array info
  sort_by(.name)             → sort array
  map(.price * 1.2)          → transform array`,

  parameters: z.object({
    input:  z.union([z.string(), z.record(z.unknown()), z.array(z.unknown())]).describe("JSON input — string, object, or array"),
    filter: z.string().default(".").describe("jq filter expression"),
    compact: z.boolean().default(false).describe("Output compact JSON (no pretty-print)"),
    raw:    z.boolean().default(false).describe("Output raw strings (no JSON quotes around strings)"),
  }),

  async execute(args): Promise<ExecuteResult> {
    const filter  = String(args["filter"] ?? ".")
    const compact = Boolean(args["compact"])
    const raw     = Boolean(args["raw"])

    // Normalize input to string
    const rawInput = args["input"]
    const inputStr = typeof rawInput === "string"
      ? rawInput
      : JSON.stringify(rawInput)

    // Try system jq first
    const jqPath = await findJq()
    if (jqPath) {
      return runSystemJq(jqPath, inputStr, filter, compact, raw)
    }

    // Built-in fallback
    return runBuiltinJq(inputStr, filter, compact, raw)
  },
}

async function findJq(): Promise<string | null> {
  for (const candidate of ["/usr/bin/jq", "/usr/local/bin/jq", "/opt/homebrew/bin/jq"]) {
    try {
      const f = Bun.file(candidate)
      if (await f.exists()) return candidate
    } catch { /* continue */ }
  }
  // Try PATH
  try {
    const proc = Bun.spawn(["which", "jq"], { stdout: "pipe", stderr: "pipe" })
    const out = await new Response(proc.stdout).text()
    const p = out.trim()
    if (p) return p
  } catch { /* continue */ }
  return null
}

async function runSystemJq(jqPath: string, input: string, filter: string, compact: boolean, raw: boolean): Promise<ExecuteResult> {
  const jqArgs = [jqPath, filter]
  if (compact) jqArgs.push("-c")
  if (raw)     jqArgs.push("-r")

  try {
    const proc = Bun.spawn(jqArgs, {
      stdin:  new TextEncoder().encode(input),
      stdout: "pipe",
      stderr: "pipe",
    })
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ])
    if (exitCode !== 0) return { output: "", error: stderr.trim() || `jq exited with ${exitCode}` }
    return { output: stdout.trim() }
  } catch (err) {
    return { output: "", error: `jq failed: ${err instanceof Error ? err.message : String(err)}` }
  }
}

function runBuiltinJq(inputStr: string, filter: string, compact: boolean, raw: boolean): ExecuteResult {
  let data: unknown
  try { data = JSON.parse(inputStr) } catch { return { output: "", error: "Invalid JSON input" } }

  try {
    const result = applyFilter(data, filter.trim())
    const note = "(system jq not found — using built-in engine; basic filters only)"

    if (raw && typeof result === "string") return { output: result + "\n" + note }
    const out = compact ? JSON.stringify(result) : JSON.stringify(result, null, 2)
    return { output: out + "\n\n" + note }
  } catch (err) {
    return { output: "", error: `Filter error: ${err instanceof Error ? err.message : String(err)}` }
  }
}

// ── Minimal jq-like filter engine ────────────────────────────────────────────

function applyFilter(data: unknown, filter: string): unknown {
  filter = filter.trim()

  // Identity
  if (filter === "." || filter === "") return data

  // Pipe: split on top-level |
  const pipeIdx = topLevelIndex(filter, "|")
  if (pipeIdx !== -1) {
    const left  = filter.slice(0, pipeIdx).trim()
    const right = filter.slice(pipeIdx + 1).trim()
    const mid   = applyFilter(data, left)
    if (Array.isArray(mid)) {
      return mid.map(item => applyFilter(item, right))
    }
    return applyFilter(mid, right)
  }

  // Array construction: [expr]
  if (filter.startsWith("[") && filter.endsWith("]")) {
    const inner = filter.slice(1, -1).trim()
    const result = applyFilter(data, inner)
    return Array.isArray(result) ? result : [result]
  }

  // Object construction: {key, key2} or {newKey: expr}
  if (filter.startsWith("{") && filter.endsWith("}")) {
    const inner = filter.slice(1, -1).trim()
    const obj: Record<string, unknown> = {}
    for (const part of inner.split(",")) {
      const kv = part.trim()
      const colonIdx = kv.indexOf(":")
      if (colonIdx === -1) {
        // shorthand {name} → extract .name
        const key = kv.replace(/^["']|["']$/g, "")
        obj[key] = getField(data, key)
      } else {
        const k   = kv.slice(0, colonIdx).trim().replace(/^["']|["']$/g, "")
        const expr = kv.slice(colonIdx + 1).trim()
        obj[k] = applyFilter(data, expr)
      }
    }
    return obj
  }

  // select(expr)
  if (filter.startsWith("select(")) {
    const inner = filter.slice(7, -1).trim()
    const val = applyFilter(data, inner)
    if (!val) throw new Error("__filter_out__")
    return data
  }

  // has(key)
  if (filter.startsWith("has(")) {
    const k = filter.slice(4, -1).replace(/["']/g, "")
    return typeof data === "object" && data !== null && k in (data as object)
  }

  // keys, values, length, type, not, empty
  if (filter === "keys")   return Object.keys(data as object)
  if (filter === "values") return Object.values(data as object)
  if (filter === "length") {
    if (Array.isArray(data) || typeof data === "string") return (data as string | unknown[]).length
    if (typeof data === "object" && data !== null) return Object.keys(data).length
    return 0
  }
  if (filter === "type") {
    if (data === null) return "null"
    if (Array.isArray(data)) return "array"
    return typeof data
  }
  if (filter === "not")   return !data
  if (filter === "empty") return undefined
  if (filter === "first") return Array.isArray(data) ? data[0] : data
  if (filter === "last")  return Array.isArray(data) ? data[data.length - 1] : data
  if (filter === "reverse") return Array.isArray(data) ? [...(data as unknown[])].reverse() : data
  if (filter === "unique") return [...new Set(data as unknown[])]
  if (filter === "flatten") return (data as unknown[][]).flat(Infinity)
  if (filter === "to_entries") {
    return Object.entries(data as object).map(([k, v]) => ({ key: k, value: v }))
  }
  if (filter === "from_entries") {
    const entries = data as Array<{ key: string; value: unknown } | { name: string; value: unknown }>
    return Object.fromEntries(entries.map(e => ["key" in e ? e.key : (e as { name: string }).name, e.value]))
  }

  // sort_by(.field)
  if (filter.startsWith("sort_by(")) {
    const expr = filter.slice(8, -1).trim()
    if (!Array.isArray(data)) return data
    return [...(data as unknown[])].sort((a, b) => {
      const av = applyFilter(a, expr)
      const bv = applyFilter(b, expr)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (av as any) < (bv as any) ? -1 : (av as any) > (bv as any) ? 1 : 0
    })
  }

  // group_by(.field)
  if (filter.startsWith("group_by(")) {
    const expr = filter.slice(9, -1).trim()
    if (!Array.isArray(data)) return data
    const groups = new Map<string, unknown[]>()
    for (const item of data as unknown[]) {
      const k = String(applyFilter(item, expr))
      if (!groups.has(k)) groups.set(k, [])
      groups.get(k)!.push(item)
    }
    return [...groups.values()]
  }

  // map(expr)
  if (filter.startsWith("map(")) {
    const expr = filter.slice(4, -1).trim()
    if (!Array.isArray(data)) return data
    return (data as unknown[]).map(item => applyFilter(item, expr))
  }

  // add
  if (filter === "add") {
    if (!Array.isArray(data)) return data
    if (data.length === 0) return null
    if (typeof data[0] === "string") return data.join("")
    if (typeof data[0] === "number") return data.reduce((a, b) => (a as number) + (b as number), 0)
    return data
  }

  // min, max
  if (filter === "min") return Array.isArray(data) ? Math.min(...(data as number[])) : data
  if (filter === "max") return Array.isArray(data) ? Math.max(...(data as number[])) : data

  // Comparison: .x > N, .x == "str", etc.
  const cmpMatch = filter.match(/^(.+?)\s*(==|!=|>=|<=|>|<)\s*(.+)$/)
  if (cmpMatch) {
    const lv = applyFilter(data, cmpMatch[1]!.trim())
    const rv = parseValue(cmpMatch[3]!.trim())
    switch (cmpMatch[2]) {
      case "==": return lv === rv
      case "!=": return lv !== rv
      case ">":  return (lv as number) >  (rv as number)
      case "<":  return (lv as number) <  (rv as number)
      case ">=": return (lv as number) >= (rv as number)
      case "<=": return (lv as number) <= (rv as number)
    }
  }

  // .[] — iterate all
  if (filter === ".[]") {
    if (Array.isArray(data)) return data
    if (typeof data === "object" && data !== null) return Object.values(data)
    return data
  }

  // .key or .key? (optional)
  const fieldMatch = filter.match(/^\.(\w[\w\d_]*)\??$/)
  if (fieldMatch) return getField(data, fieldMatch[1]!)

  // .[N] — array index
  const idxMatch = filter.match(/^\.\[(-?\d+)\]$/)
  if (idxMatch) {
    const idx = parseInt(idxMatch[1]!, 10)
    if (!Array.isArray(data)) return undefined
    return idx < 0 ? data[data.length + idx] : data[idx]
  }

  // .key.nested.deep
  if (filter.startsWith(".")) {
    const path = filter.slice(1).split(".").filter(Boolean)
    let cur: unknown = data
    for (const seg of path) {
      const arrIdx = seg.match(/^(\w+)\[(-?\d+)\]$/)
      if (arrIdx) {
        cur = getField(cur, arrIdx[1]!)
        const idx = parseInt(arrIdx[2]!, 10)
        if (Array.isArray(cur)) cur = idx < 0 ? cur[cur.length + idx] : cur[idx]
        else cur = undefined
      } else {
        cur = getField(cur, seg.replace(/\?$/, ""))
      }
      if (cur === undefined || cur === null) break
    }
    return cur
  }

  throw new Error(`Unsupported filter: "${filter}" — install system jq for full support`)
}

function getField(data: unknown, key: string): unknown {
  if (data === null || data === undefined) return undefined
  if (typeof data !== "object") return undefined
  return (data as Record<string, unknown>)[key]
}

function parseValue(s: string): unknown {
  if (s === "true")  return true
  if (s === "false") return false
  if (s === "null")  return null
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1)
  }
  const n = Number(s)
  return isNaN(n) ? s : n
}

function topLevelIndex(s: string, char: string): number {
  let depth = 0
  let inStr = false
  let quote = ""
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!
    if (inStr) {
      if (c === "\\" ) { i++; continue }
      if (c === quote) inStr = false
    } else if (c === '"' || c === "'") {
      inStr = true; quote = c
    } else if (c === "(" || c === "[" || c === "{") {
      depth++
    } else if (c === ")" || c === "]" || c === "}") {
      depth--
    } else if (depth === 0 && s.slice(i, i + char.length) === char) {
      return i
    }
  }
  return -1
}

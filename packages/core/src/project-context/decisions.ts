import { join } from "node:path"
import { existsSync, readdirSync, readFileSync } from "node:fs"

const MAX_DECISIONS_CHARS  = 2_000
const MAX_PER_DECISION     = 150

interface DecisionSummary {
  id:      string
  title:   string
  problem: string
  status:  string
}

function parseDecision(content: string, filename: string): DecisionSummary | null {
  const lines = content.split("\n")

  const titleLine = lines.find(l => l.startsWith("# "))
  const title     = titleLine ? titleLine.replace(/^# /, "").trim() : filename.replace(/\.md$/, "")

  const problemLine = lines.find(l => /^\*\*Problem:\*\*/.test(l))
  const problem     = problemLine ? problemLine.replace(/^\*\*Problem:\*\*\s*/, "").trim() : ""

  // Support both English (Status) and legacy Turkish (Durum)
  const statusLine  = lines.find(l => /^\*\*(Status|Durum):\*\*/.test(l))
  const status      = statusLine ? statusLine.replace(/^\*\*(Status|Durum):\*\*\s*/, "").trim().toLowerCase() : "active"

  return { id: filename.replace(/\.md$/, ""), title, problem, status }
}

export function readDecisions(workdir: string): string {
  const dir = join(workdir, ".aurict", "decisions")
  if (!existsSync(dir)) return ""

  let files: string[]
  try {
    files = readdirSync(dir).filter(f => f.endsWith(".md")).sort()
  } catch { return "" }

  if (files.length === 0) return ""

  const summaries: DecisionSummary[] = []
  for (const file of files) {
    try {
      const content = readFileSync(join(dir, file), "utf8").trim()
      const s = parseDecision(content, file)
      if (s && s.status === "active") summaries.push(s)
    } catch { continue }
  }

  if (summaries.length === 0) return ""

  const lines = summaries.map((s) => {
    const problem = s.problem.length > MAX_PER_DECISION
      ? s.problem.slice(0, MAX_PER_DECISION) + "..."
      : s.problem
    return `- **${s.id}**: ${s.title}${problem ? ` — ${problem}` : ""}`
  })

  let result = `## Active Architecture Decisions\n\n${lines.join("\n")}`
  if (result.length > MAX_DECISIONS_CHARS) {
    result = result.slice(0, MAX_DECISIONS_CHARS) + "\n[... truncated]"
  }
  return result
}

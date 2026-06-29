import { loadCustomAgents } from "./custom.js"

export interface SessionAgentDef {
  id:            string
  name:          string
  description:   string
  system:        string        // Ana system prompt'a ek olarak inject edilir ("" = ek yok)
  allowedTools?: string[]      // undefined = tüm tool'lar serbest
  color:         string        // StatusBar + picker rengi
  native:        boolean       // built-in mi?
}

// ── Built-in session agent'lar ────────────────────────────────────────────────

export const BUILT_IN_SESSION_AGENTS: SessionAgentDef[] = [
  {
    id:          "omni",
    name:        "Omni",
    description: "Full capabilities — the standard Aurict assistant",
    system:      "",            // Ek prompt yok — FULL_SYSTEM_PROMPT yeterli
    color:       "#06b6d4",
    native:      true,
  },
  {
    id:          "plan",
    name:        "Plan",
    description: "Read-only — analyze codebase and produce a structured plan, no code changes",
    system: `## Plan Mode

You are in planning-only mode. You CANNOT write, edit, apply patches, or execute commands.

Your job:
1. Read and understand the codebase (use read, glob, grep, lsp)
2. Understand the requirement fully before planning
3. Produce a numbered, step-by-step implementation plan

Plan format:
- Step N: [what to do] — [file path] — [why]
- Dependencies: which steps must come before which
- Estimated complexity: trivial / small / medium / large

Output the plan, then stop. Do not say "let me implement" — only plan.
The user will switch to Omni agent to execute.`,
    allowedTools: ["read", "glob", "grep", "lsp", "websearch", "webfetch"],
    color:        "#a78bfa",
    native:       true,
  },
  {
    id:          "review",
    name:        "Review",
    description: "Read-only — code review, bug finding, security analysis",
    system: `## Review Mode

You are a code reviewer. You have read-only access — you cannot modify any files.

Focus on:
- Correctness: logic errors, edge cases, off-by-one errors
- Security: injection, auth bypass, hardcoded secrets, unsafe dependencies
- Performance: unnecessary loops, missing indexes, memory leaks
- Maintainability: naming, complexity, duplication

Format every finding as:
  [CRITICAL/WARNING/SUGGESTION] path/file.ts:line — what is wrong — how to fix it

Rules:
- Be specific. No vague comments like "this could be better".
- No praise. Only findings.
- If you find nothing wrong, say so explicitly.`,
    allowedTools: ["read", "glob", "grep", "lsp"],
    color:        "#f59e0b",
    native:       true,
  },
  {
    id:          "security",
    name:        "Security",
    description: "Security operator mode — scoped assessment, evidence validation, and reporting",
    system: `## Security Session Mode

You are operating Aurict as a security-focused agent. Keep normal coding tasks
separate from security assessment work.

Security workflow:
1. Classify scope and authorization.
2. Use passive review first.
3. Use active security tools only when securitySandbox exposes them and targets are allowlisted.
4. Treat scanner output as unverified until evidence validation and false-positive review.
5. For medium/high findings, use a verifier-style pass before reporting as confirmed.
6. Produce reports from distilled findings, not raw scanner dumps.

Prefer specialized subagents when useful:
- security_operator for scoped authorized assessment loops.
- security_verifier for evidence and false-positive review.
- security_reporter for final report generation.

If the security capability is disabled, explain which passive review steps are still possible and do not request active scans.`,
    allowedTools: [
      "read", "write", "glob", "grep", "lsp", "webfetch", "websearch",
      "symbols", "code_map", "scratchpad", "subagent", "security_recon",
      "security_scan", "security_verify", "security_attack_graph", "security_log_analyze",
      "security_threat_model", "security_report", "send_message", "file_stat",
    ],
    color:        "#ef4444",
    native:       true,
  },
]

const BUILT_IN_MAP = new Map(BUILT_IN_SESSION_AGENTS.map((a) => [a.id, a]))

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Built-in + custom agent'ları birleştirir.
 * Custom agent'lar aynı ID ile built-in'i override eder.
 */
export function getAllSessionAgents(workdir: string): SessionAgentDef[] {
  const custom = loadCustomAgents(workdir).map((c): SessionAgentDef => ({
    id:            c.id,
    name:          c.name,
    description:   c.description || "Custom agent",
    system:        c.system,
    color:         "#34d399",
    native:        false,
    ...(c.tools?.length ? { allowedTools: c.tools } : {}),
  }))

  // Custom override built-in (aynı ID varsa)
  const merged = new Map(BUILT_IN_MAP)
  for (const c of custom) merged.set(c.id, c)
  return [...merged.values()]
}

export function getSessionAgent(id: string, workdir: string): SessionAgentDef {
  return getAllSessionAgents(workdir).find((a) => a.id === id)
    ?? BUILT_IN_SESSION_AGENTS[0]!   // fallback: Omni
}

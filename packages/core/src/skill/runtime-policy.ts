export interface ActiveSkillPolicy {
  skillId: string
  skillName: string
  allowedTools: string[]
  executionContext?: "inline" | "fork" | undefined
  model?: string | undefined
  effort?: string | undefined
}

const policies = new Map<string, ActiveSkillPolicy>()

export function setActiveSkillPolicy(sessionId: string, policy: ActiveSkillPolicy): void {
  policies.set(normalizeSessionId(sessionId), {
    ...policy,
    allowedTools: policy.allowedTools.map(normalizeToolName).filter(Boolean),
  })
}

export function getActiveSkillPolicy(sessionId: string): ActiveSkillPolicy | null {
  return policies.get(normalizeSessionId(sessionId)) ?? null
}

export function clearActiveSkillPolicy(sessionId?: string): void {
  if (sessionId === undefined) policies.clear()
  else policies.delete(normalizeSessionId(sessionId))
}

export function isToolAllowedByActiveSkillPolicy(sessionId: string, toolId: string): { allowed: true } | { allowed: false; reason: string } {
  const policy = getActiveSkillPolicy(sessionId)
  if (!policy || policy.allowedTools.length === 0) return { allowed: true }

  const normalizedTool = normalizeToolName(toolId)
  const alwaysAllowed = new Set(["load_skill", "question", "todo", "scratchpad"])
  if (alwaysAllowed.has(normalizedTool)) return { allowed: true }
  if (policy.executionContext === "fork" && normalizedTool === "subagent") return { allowed: true }
  if (policy.allowedTools.includes(normalizedTool)) return { allowed: true }

  return {
    allowed: false,
    reason: `Tool '${toolId}' is not allowed by active skill '${policy.skillId}'. Allowed tools: ${policy.allowedTools.join(", ")}`,
  }
}

export function normalizeToolName(name: string): string {
  return name
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/^aurict:/i, "")
    .replace(/^tool:/i, "")
    .replace(/-/g, "_")
    .toLowerCase()
}

function normalizeSessionId(sessionId: string): string {
  return sessionId || "__default__"
}

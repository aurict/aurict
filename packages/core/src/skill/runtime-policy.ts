export interface ActiveSkillPolicy {
  skillId: string
  skillName: string
  allowedTools: string[]
  executionContext?: "inline" | "fork" | undefined
  model?: string | undefined
  effort?: string | undefined
  loadedAt?: number | undefined
}

export interface SkillLifecycleSnapshot {
  active: ActiveSkillPolicy | null
  stack: ActiveSkillPolicy[]
}

const policies = new Map<string, ActiveSkillPolicy[]>()

export function setActiveSkillPolicy(sessionId: string, policy: ActiveSkillPolicy): void {
  pushActiveSkillPolicy(sessionId, policy)
}

export function pushActiveSkillPolicy(sessionId: string, policy: ActiveSkillPolicy): SkillLifecycleSnapshot {
  const key = normalizeSessionId(sessionId)
  const stack = policies.get(key) ?? []
  const normalized = normalizePolicy(policy)
  policies.set(key, [...stack, normalized])
  return getSkillLifecycleSnapshot(sessionId)
}

export function popActiveSkillPolicy(sessionId: string): ActiveSkillPolicy | null {
  const key = normalizeSessionId(sessionId)
  const stack = policies.get(key) ?? []
  if (stack.length === 0) return null
  const popped = stack[stack.length - 1] ?? null
  const next = stack.slice(0, -1)
  if (next.length === 0) policies.delete(key)
  else policies.set(key, next)
  return popped
}

export function restoreSkillLifecycle(sessionId: string, stack: ActiveSkillPolicy[]): void {
  const key = normalizeSessionId(sessionId)
  const normalized = stack.map(normalizePolicy)
  if (normalized.length === 0) policies.delete(key)
  else policies.set(key, normalized)
}

export function getSkillLifecycleSnapshot(sessionId: string): SkillLifecycleSnapshot {
  const stack = policies.get(normalizeSessionId(sessionId)) ?? []
  return {
    active: stack.at(-1) ?? null,
    stack: [...stack],
  }
}

function normalizePolicy(policy: ActiveSkillPolicy): ActiveSkillPolicy {
  return {
    ...policy,
    allowedTools: policy.allowedTools.map(normalizeToolName).filter(Boolean),
    loadedAt: policy.loadedAt ?? Date.now(),
  }
}

export function getActiveSkillPolicy(sessionId: string): ActiveSkillPolicy | null {
  return getSkillLifecycleSnapshot(sessionId).active
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

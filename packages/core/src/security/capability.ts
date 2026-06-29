import { z } from "zod"
import type { AgentType } from "../agent/protocol.js"
import { resolveSecuritySandboxConfig, type OmniConfig, type ResolvedSecuritySandboxConfig, type SecuritySandboxConfig } from "../config/config.js"
import type { SkillDef } from "../skill/types.js"
import type { ToolDef } from "../tool/types.js"

export type SecurityCapabilityClass = "none" | "passive-security" | "active-security"

const ACTIVE_SECURITY_SKILL_IDS = new Set([
  "pentest-cloud",
  "pentest-owasp",
  "pentest-protocols",
  "pentest-recon",
  "pentest-tooling",
])

const PASSIVE_SECURITY_SKILL_IDS = new Set([
  "authentication-patterns",
  "clerk-auth",
  "compliance-gdpr",
  "cryptography-patterns",
  "network-security",
  "rate-limiting",
  "security-review",
])

const ACTIVE_SECURITY_AGENT_TYPES = new Set<AgentType>(["security", "pentest"])
const PASSIVE_SECURITY_AGENT_TYPES = new Set<AgentType>(["adviser", "reporter"])

const ACTIVE_SECURITY_TOOL_IDS = new Set([
  "security_recon",
  "security_scan",
  "security_shell",
  "pentest_run",
  "track_variable_taint",
  "inspect_live_process",
])

const PASSIVE_SECURITY_TOOL_IDS = new Set([
  "security_report",
])

const AGENT_DESCRIPTIONS: Record<AgentType, string> = {
  coordinator: "orchestrates worker agents",
  explore: "read-only research",
  code: "coding and implementation",
  review: "read-only code review",
  test: "test execution and verification",
  docs: "documentation work",
  performance: "profiling and performance analysis",
  analytics: "metrics and log analysis",
  security: "security audit and active scanning",
  pentest: "active penetration testing",
  adviser: "security strategy, no active execution",
  reporter: "security report generation",
  debug: "debugging",
  refactor: "safe code transformation",
  devops: "infrastructure and CI/CD work",
  design: "UI/UX artifacts",
  data: "data transformation and analysis",
  critic: "read-only critique",
}

const BUILT_IN_TASK_TYPES: AgentType[] = [
  "explore", "code", "review", "test", "docs", "performance", "analytics", "security", "debug",
]

export function normalizeSecuritySandboxConfig(config?: OmniConfig | SecuritySandboxConfig): ResolvedSecuritySandboxConfig {
  return resolveSecuritySandboxConfig(config)
}

export function isPassiveSecurityEnabled(config?: OmniConfig | SecuritySandboxConfig): boolean {
  const security = normalizeSecuritySandboxConfig(config)
  return security.enabled === true && security.profile !== "off"
}

export function isActiveSecurityEnabled(config?: OmniConfig | SecuritySandboxConfig): boolean {
  const security = normalizeSecuritySandboxConfig(config)
  return security.enabled === true && (security.profile === "active-lite" || security.profile === "kali-full")
}

export function classifySkillSecurityCapability(skill: Pick<SkillDef, "id" | "agent" | "tags" | "description" | "name">): SecurityCapabilityClass {
  if (ACTIVE_SECURITY_SKILL_IDS.has(skill.id) || skill.agent === "pentest") return "active-security"

  const tags = skill.tags.map((tag) => tag.toLowerCase())
  if (tags.includes("pentest") || tags.includes("offensive-security")) return "active-security"

  const text = `${skill.id} ${skill.name} ${skill.description} ${skill.agent ?? ""} ${tags.join(" ")}`.toLowerCase()
  if (/\b(pentest|penetration test|exploit|active exploitation|attack pattern|reconnaissance|sqlmap|nmap|ffuf|nuclei)\b/.test(text)) {
    return "active-security"
  }

  if (PASSIVE_SECURITY_SKILL_IDS.has(skill.id)) return "passive-security"
  if (tags.includes("security") || tags.includes("auth") || /\b(security|auth|cryptography|owasp|vulnerability)\b/.test(text)) {
    return "passive-security"
  }

  return "none"
}

export function isSkillVisibleForSecurityCapability(skill: SkillDef, config?: OmniConfig | SecuritySandboxConfig): boolean {
  const capability = classifySkillSecurityCapability(skill)
  if (capability === "none") return true
  if (capability === "passive-security") return isPassiveSecurityEnabled(config)
  return isActiveSecurityEnabled(config)
}

export function filterSkillDefsForSecurityCapability<T extends SkillDef>(skills: T[], config?: OmniConfig | SecuritySandboxConfig): T[] {
  return skills.filter((skill) => isSkillVisibleForSecurityCapability(skill, config))
}

export function isToolVisibleForSecurityCapability(toolId: string, config?: OmniConfig | SecuritySandboxConfig): boolean {
  if (ACTIVE_SECURITY_TOOL_IDS.has(toolId)) return isActiveSecurityEnabled(config)
  if (PASSIVE_SECURITY_TOOL_IDS.has(toolId)) return isPassiveSecurityEnabled(config)
  return true
}

export function filterToolIdsForSecurityCapability(toolIds: string[], config?: OmniConfig | SecuritySandboxConfig): string[] {
  return toolIds.filter((toolId) => isToolVisibleForSecurityCapability(toolId, config))
}

export function classifyToolSecurityCapability(def: ToolDef): SecurityCapabilityClass {
  if (def.spec?.securityCapability === "active") return "active-security"
  if (def.spec?.securityCapability === "passive") return "passive-security"
  if (ACTIVE_SECURITY_TOOL_IDS.has(def.id)) return "active-security"
  if (PASSIVE_SECURITY_TOOL_IDS.has(def.id)) return "passive-security"
  return "none"
}

export function isAgentTypeVisibleForSecurityCapability(agentType: AgentType, config?: OmniConfig | SecuritySandboxConfig): boolean {
  if (ACTIVE_SECURITY_AGENT_TYPES.has(agentType)) return isActiveSecurityEnabled(config)
  if (PASSIVE_SECURITY_AGENT_TYPES.has(agentType)) return isPassiveSecurityEnabled(config)
  return true
}

export function visibleAgentTypesForSecurityCapability(agentTypes: readonly AgentType[], config?: OmniConfig | SecuritySandboxConfig): AgentType[] {
  return agentTypes.filter((agentType) => isAgentTypeVisibleForSecurityCapability(agentType, config))
}

export function prepareToolForSecurityCapability(def: ToolDef, config?: OmniConfig | SecuritySandboxConfig): ToolDef | null {
  const capability = classifyToolSecurityCapability(def)
  if (capability === "active-security" && !isActiveSecurityEnabled(config)) return null
  if (capability === "passive-security" && !isPassiveSecurityEnabled(config)) return null
  if (def.id === "subagent") return sanitizeSubagentTool(def, config)
  if (def.id === "task") return sanitizeTaskTool(def, config)
  return def
}

function sanitizeSubagentTool(def: ToolDef, config?: OmniConfig | SecuritySandboxConfig): ToolDef {
  const visible = visibleAgentTypesForSecurityCapability(Object.keys(AGENT_DESCRIPTIONS) as AgentType[], config)
  const enumValues = tupleOrExplore(visible)
  return {
    ...def,
    description: [
      "Spawn a parallel worker agent to perform a specific task.",
      "",
      "Available agent types:",
      ...visible.map((type) => `- ${type}: ${AGENT_DESCRIPTIONS[type]}`),
      "",
      "The subagent receives recent parent conversation context automatically.",
    ].join("\n"),
    parameters: z.object({
      type: z.enum(enumValues)
        .default("explore")
        .describe("Agent type — determines which tools the worker can use"),
      role: z.string().describe("Brief worker title, e.g. 'Codebase Scanner', 'Test Runner', 'Code Reviewer'"),
      prompt: z.string().describe("Task instructions. Include: goal, relevant file paths or patterns, expected output format."),
    }),
  }
}

function sanitizeTaskTool(def: ToolDef, config?: OmniConfig | SecuritySandboxConfig): ToolDef {
  const visible = visibleAgentTypesForSecurityCapability(BUILT_IN_TASK_TYPES, config)
  return {
    ...def,
    description: `Spawn a specialized subagent. Built-in types: ${visible.join(", ")}. Custom agents: use the agent ID from .aurict/agents/*.md`,
    parameters: z.object({
      type: z.string().describe(`Agent type. Available built-in types: ${visible.join(", ")}; or a custom agent ID from .aurict/agents/`),
      description: z.string().describe("Short description of this agent's task (shown in UI)"),
      prompt: z.string().describe("Detailed instructions for the subagent"),
      background: z.boolean().optional().describe("If true, don't wait for result (fire and forget)"),
      model: z.string().optional().describe("Override model (default: inherits from calling agent)"),
    }),
  }
}

function tupleOrExplore(values: AgentType[]): [AgentType, ...AgentType[]] {
  return values.length > 0 ? values as [AgentType, ...AgentType[]] : ["explore"]
}

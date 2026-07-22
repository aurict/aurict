import type { CoreMessage } from "ai"
import { applyPromptTier } from "../agent/prompt-tier.js"
import { extractTurnStatus } from "../agent/turn-status.js"
import type { ResolvedPromptSection } from "../agent/prompt-sections.js"
import { buildBoundedSummaryTranscript } from "../session/summary-input.js"
import { selectTools } from "../tool/capability-router.js"

export type AgentPolicyProfile = "legacy" | "current"

export interface AgentPolicyEvalResult {
  profile: AgentPolicyProfile
  passed: number
  total: number
  score: number
  metrics: {
    routedCapabilities: string[]
    promptChars: number
    summaryChars: number
    structuredStatus: string | null
  }
  cases: Array<{ id: string; ok: boolean; detail: string }>
}

export interface AgentPolicyComparison {
  legacy: AgentPolicyEvalResult
  current: AgentPolicyEvalResult
  delta: { score: number; promptChars: number }
}

const AVAILABLE_TOOLS = [
  "read", "grep", "edit", "bash", "verify", "websearch",
  "security_scan", "document_extract", "request_tools",
]

export function runAgentPolicyEval(profile: AgentPolicyProfile): AgentPolicyEvalResult {
  const routing = selectTools({
    text: "continue",
    ...(profile === "current"
      ? { objective: "Audit the security boundary and research current guidance", requestedCapabilities: ["document"] }
      : {}),
    availableToolIds: AVAILABLE_TOOLS,
    maxVisible: 20,
  })
  const tiered = profile === "current"
    ? applyPromptTier(promptFixture(), 8_000)
    : { sections: promptFixture() }
  const promptChars = tiered.sections.reduce((sum, section) => sum + section.content.length, 0)
  const summary = buildBoundedSummaryTranscript(summaryFixture(), 1_000)
  const status = profile === "current"
    ? extractTurnStatus("Finished. <aurict_status state=\"done\"></aurict_status>").status
    : undefined

  const cases = [
    {
      id: "continuation_keeps_objective_routing",
      ok: routing.capabilities.includes("security") && routing.capabilities.includes("research"),
      detail: routing.capabilities.join(","),
    },
    {
      id: "explicit_tool_expansion_survives",
      ok: routing.capabilities.includes("document"),
      detail: routing.selectedToolIds.join(","),
    },
    {
      id: "small_model_prompt_is_bounded",
      ok: promptChars < 8_000,
      detail: `${promptChars} chars`,
    },
    {
      id: "summary_input_is_bounded",
      ok: summary.length < 15_000 && summary.includes("latest blocker"),
      detail: `${summary.length} chars`,
    },
    {
      id: "structured_completion_is_machine_readable",
      ok: status?.state === "done",
      detail: status?.state ?? "missing",
    },
  ]
  const passed = cases.filter(testCase => testCase.ok).length
  return {
    profile,
    passed,
    total: cases.length,
    score: passed / cases.length,
    metrics: {
      routedCapabilities: routing.capabilities,
      promptChars,
      summaryChars: summary.length,
      structuredStatus: status?.state ?? null,
    },
    cases,
  }
}

export function compareAgentPolicies(): AgentPolicyComparison {
  const legacy = runAgentPolicyEval("legacy")
  const current = runAgentPolicyEval("current")
  return {
    legacy,
    current,
    delta: {
      score: current.score - legacy.score,
      promptChars: current.metrics.promptChars - legacy.metrics.promptChars,
    },
  }
}

function promptFixture(): ResolvedPromptSection[] {
  return [
    { name: "core_system:main", cache: "static", content: "core ".repeat(3_000) },
    { name: "project_instructions", cache: "session", content: "project ".repeat(700) },
    { name: "skills", cache: "session", content: "skills ".repeat(700) },
    { name: "canonical_agent_state", cache: "dynamic", content: "state ".repeat(500) },
  ]
}

function summaryFixture(): CoreMessage[] {
  return [
    { role: "user", content: "old context ".repeat(5_000) },
    { role: "assistant", content: "recent decision" },
    { role: "user", content: "latest blocker" },
  ]
}

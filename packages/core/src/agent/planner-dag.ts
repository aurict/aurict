import type { AgentType } from "./protocol.js"
import type { TaskNode } from "./decomposition.js"
import type { DAGNode } from "./dag-orchestrator.js"

export interface PlannedTask {
  id: string
  description: string
  agentType: AgentType
  dependencies?: string[]
  fileScopes?: string[]
  maxAttempts?: number
}

export function buildPlannerDAG(leaves: TaskNode[], objective: string): DAGNode[] {
  const exploreIds = leaves.filter(leaf => leaf.agentType === "explore").map(leaf => leaf.id)
  const changeIds = leaves
    .filter(leaf => ["code", "refactor", "debug", "docs", "design", "data", "devops"].includes(leaf.agentType ?? "code"))
    .map(leaf => leaf.id)

  return leaves.map(leaf => {
    const agentType = leaf.agentType ?? "code"
    const dependencies = ["review", "test", "critic"].includes(agentType)
      ? changeIds.filter(id => id !== leaf.id)
      : ["code", "refactor", "debug"].includes(agentType)
        ? exploreIds.filter(id => id !== leaf.id)
        : []
    return {
      id: leaf.id,
      agentType,
      desc: leaf.description,
      prompt: taskPrompt(objective, leaf.description, leaf.scope),
      dependencies,
      ...(leaf.level === "file" && leaf.scope !== "project" ? { fileScopes: [leaf.scope] } : {}),
      status: "pending",
    }
  })
}

export function buildExplicitDAG(tasks: PlannedTask[], objective: string): DAGNode[] {
  return tasks.map(task => ({
    id: task.id,
    agentType: task.agentType,
    desc: task.description,
    prompt: taskPrompt(objective, task.description, task.fileScopes?.join(", ") || "project"),
    dependencies: [...(task.dependencies ?? [])],
    ...(task.fileScopes ? { fileScopes: [...task.fileScopes] } : {}),
    ...(task.maxAttempts !== undefined ? { maxAttempts: task.maxAttempts } : {}),
    status: "pending",
  }))
}

function taskPrompt(objective: string, description: string, scope: string): string {
  return [
    "## Orchestrated Sub-task",
    `Parent objective: ${objective}`,
    `Your specific focus: ${description}`,
    `Scope: ${scope}`,
    "Report concrete results and verification evidence. Your output is consumed by dependent tasks.",
  ].join("\n\n")
}

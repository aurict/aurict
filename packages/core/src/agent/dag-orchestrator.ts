import type { AgentType } from "./protocol.js"
import { agentPool } from "./pool.js"
import { taskManager } from "../task/manager.js"

export type DAGNodeStatus = "pending" | "running" | "completed" | "failed" | "blocked"

export interface DAGNode {
  id: string
  agentType: AgentType
  desc: string
  prompt: string
  dependencies: string[]
  fileScopes?: string[]
  maxAttempts?: number
  optional?: boolean
  status: DAGNodeStatus
  attempts?: number
  output?: string
  error?: string
}

export interface DAGRunOptions {
  parentSessionId: string
  provider: string
  model: string
  workdir: string
  maxConcurrency?: number
}

type SpawnWorker = typeof agentPool.spawn

export class DAGOrchestrator {
  private readonly nodes = new Map<string, DAGNode>()

  constructor(nodes: DAGNode[], private readonly spawnWorker: SpawnWorker = agentPool.spawn.bind(agentPool)) {
    this.validate(nodes)
    for (const node of nodes) this.nodes.set(node.id, { ...node, status: "pending", attempts: 0 })
  }

  async run(opts: DAGRunOptions): Promise<{
    outputs: Record<string, string>
    errors: Record<string, string>
    statuses: Record<string, DAGNodeStatus>
  }> {
    const outputs: Record<string, string> = {}
    const errors: Record<string, string> = {}
    const scope = taskManager.configureScope(opts.workdir, opts.parentSessionId)
    for (const node of this.nodes.values()) {
      if (!taskManager.getTask(node.id, scope)) taskManager.createTask(node.id, node.desc, node.dependencies, scope)
    }

    while ([...this.nodes.values()].some(node => node.status === "pending")) {
      this.blockFailedDescendants(errors, scope)
      const ready = [...this.nodes.values()].filter(node =>
        node.status === "pending"
        && node.dependencies.every(dependency => this.nodes.get(dependency)?.status === "completed")
      )
      const batch = selectNonConflicting(ready, opts.maxConcurrency ?? Number.POSITIVE_INFINITY)
      if (batch.length === 0) {
        if ([...this.nodes.values()].every(node => node.status !== "pending")) break
        throw new Error("Orchestration deadlock: no runnable nodes")
      }
      await Promise.all(batch.map(node => this.executeNode(node, opts, outputs, errors, scope)))
    }

    return {
      outputs,
      errors,
      statuses: Object.fromEntries([...this.nodes].map(([id, node]) => [id, node.status])),
    }
  }

  private async executeNode(
    node: DAGNode,
    opts: DAGRunOptions,
    outputs: Record<string, string>,
    errors: Record<string, string>,
    scope: ReturnType<typeof taskManager.configureScope>,
  ): Promise<void> {
    node.status = "running"
    taskManager.updateTask(node.id, { status: "in_progress", owner: node.agentType }, scope)
    const maxAttempts = Math.max(1, node.maxAttempts ?? 2)
    while ((node.attempts ?? 0) < maxAttempts) {
      node.attempts = (node.attempts ?? 0) + 1
      try {
        const result = await this.spawnWorker({
          id: node.id,
          agentType: node.agentType,
          desc: node.desc,
          prompt: this.enrichedPrompt(node),
          provider: opts.provider,
          model: opts.model,
          workdir: opts.workdir,
          sessionId: opts.parentSessionId,
          workerSessionId: node.id,
        })
        node.status = "completed"
        node.output = result
        outputs[node.id] = result
        taskManager.completeTask(node.id, result, scope)
        return
      } catch (error) {
        node.error = error instanceof Error ? error.message : String(error)
      }
    }
    node.status = "failed"
    errors[node.id] = node.error ?? "Worker failed"
    taskManager.failTask(node.id, errors[node.id]!, scope)
  }

  private enrichedPrompt(node: DAGNode): string {
    const dependencyOutputs = node.dependencies
      .map(id => this.nodes.get(id))
      .filter((dependency): dependency is DAGNode => Boolean(dependency?.output))
      .map(dependency => `--- Output from '${dependency.id}' (${dependency.agentType}) ---\n${dependency.output}`)
    return dependencyOutputs.length === 0
      ? node.prompt
      : `${node.prompt}\n\n[DEPENDENT TASK OUTPUTS]\n${dependencyOutputs.join("\n")}`
  }

  private blockFailedDescendants(errors: Record<string, string>, scope: ReturnType<typeof taskManager.configureScope>): void {
    let changed = true
    while (changed) {
      changed = false
      for (const node of this.nodes.values()) {
        if (node.status !== "pending") continue
        const blocker = node.dependencies.map(id => this.nodes.get(id)).find(dep => dep?.status === "failed" || dep?.status === "blocked")
        if (!blocker) continue
        node.status = "blocked"
        node.error = `Blocked by failed dependency '${blocker.id}'`
        errors[node.id] = node.error
        taskManager.updateTask(node.id, { status: "blocked", error: node.error }, scope)
        changed = true
      }
    }
  }

  private validate(nodes: DAGNode[]): void {
    const ids = new Set(nodes.map(node => node.id))
    if (ids.size !== nodes.length) throw new Error("Duplicate node ID in DAG")
    for (const node of nodes) {
      for (const dependency of node.dependencies) {
        if (!ids.has(dependency)) throw new Error(`Unknown dependency '${dependency}' for node '${node.id}'`)
      }
    }
    const visited = new Set<string>()
    const visiting = new Set<string>()
    const byId = new Map(nodes.map(node => [node.id, node]))
    const visit = (id: string): void => {
      if (visiting.has(id)) throw new Error(`Cycle detected in DAG task dependencies at node '${id}'`)
      if (visited.has(id)) return
      visiting.add(id)
      for (const dependency of byId.get(id)?.dependencies ?? []) visit(dependency)
      visiting.delete(id)
      visited.add(id)
    }
    for (const node of nodes) visit(node.id)
  }
}

function selectNonConflicting(nodes: DAGNode[], limit: number): DAGNode[] {
  const selected: DAGNode[] = []
  for (const node of nodes) {
    if (selected.length >= limit) break
    if (selected.some(other => scopesConflict(node.fileScopes ?? [], other.fileScopes ?? []))) continue
    selected.push(node)
  }
  return selected
}

function scopesConflict(left: string[], right: string[]): boolean {
  if (left.length === 0 || right.length === 0) return false
  return left.some(a => right.some(b => a === "*" || b === "*" || a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`)))
}

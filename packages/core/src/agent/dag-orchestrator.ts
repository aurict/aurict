import type { AgentType } from "./protocol.js"
import { agentPool } from "./pool.js"

export interface DAGNode {
  id: string
  agentType: AgentType
  desc: string
  prompt: string
  dependencies: string[]
  status: "pending" | "running" | "completed" | "failed"
  output?: string
  error?: string
}

export class DAGOrchestrator {
  private nodes = new Map<string, DAGNode>()

  constructor(nodes: DAGNode[]) {
    // Cycle check (bağımlılıklarda döngü kontrolü)
    this.detectCycles(nodes)
    for (const n of nodes) {
      this.nodes.set(n.id, { ...n, status: "pending" })
    }
  }

  private detectCycles(nodes: DAGNode[]) {
    const adj = new Map<string, string[]>()
    for (const n of nodes) {
      adj.set(n.id, n.dependencies)
    }

    const visited = new Set<string>()
    const recStack = new Set<string>()

    const dfs = (id: string): boolean => {
      if (recStack.has(id)) return true
      if (visited.has(id)) return false

      visited.add(id)
      recStack.add(id)

      const deps = adj.get(id) ?? []
      for (const d of deps) {
        if (dfs(d)) return true
      }

      recStack.delete(id)
      return false
    }

    for (const n of nodes) {
      if (dfs(n.id)) {
        throw new Error(`Cycle detected in DAG task dependencies at node '${n.id}'`)
      }
    }
  }

  async run(opts: {
    parentSessionId: string
    provider: string
    model: string
    workdir: string
  }): Promise<{ outputs: Record<string, string>; errors: Record<string, string> }> {
    const outputs: Record<string, string> = {}
    const errors: Record<string, string> = {}

    // Grafın tamamlanmasını izleyen ana döngü
    while (true) {
      const activeNodes = [...this.nodes.values()]
      const allDone = activeNodes.every(n => n.status === "completed" || n.status === "failed")
      if (allDone) break

      const hasFailed = activeNodes.some(n => n.status === "failed")
      if (hasFailed) {
        // Bir görev çöktüyse zinciri bozup iptal et
        const pending = activeNodes.filter(n => n.status === "pending")
        for (const p of pending) {
          p.status = "failed"
          p.error = "Cancelled due to dependency failure"
          errors[p.id] = p.error
        }
        break
      }

      // Çalışmaya hazır düğümleri bul (dependencies completed olanlar)
      const runnable = activeNodes.filter(n => {
        if (n.status !== "pending") return false
        return n.dependencies.every(depId => {
          const dep = this.nodes.get(depId)
          return dep && dep.status === "completed"
        })
      })

      if (runnable.length === 0) {
        // Hiç runnable yok ama hala tamamlanmamış/çalışanlar var, bekle
        const running = activeNodes.filter(n => n.status === "running")
        if (running.length === 0) {
          // Kilitlenme (Deadlock)
          throw new Error("Orchestration deadlock: no running or runnable nodes")
        }
        // Kısa bir süre uyu ve tekrar kontrol et
        await new Promise(r => setTimeout(r, 200))
        continue
      }

      // Runnable'ları paralel başlat
      await Promise.all(
        runnable.map(async (node) => {
          node.status = "running"
          try {
            // Ajanın prompt'unu bağımlı olduğu çıktıları enjekte edecek şekilde zenginleştir
            let enrichedPrompt = node.prompt
            if (node.dependencies.length > 0) {
              enrichedPrompt += "\n\n[DEPENDENT TASK OUTPUTS]\n"
              for (const depId of node.dependencies) {
                const dep = this.nodes.get(depId)
                if (dep?.output) {
                  enrichedPrompt += `--- Output from '${depId}' (${dep.agentType}) ---\n${dep.output}\n`
                }
              }
            }

            const result = await agentPool.spawn({
              id: node.id,
              agentType: node.agentType,
              desc: node.desc,
              prompt: enrichedPrompt,
              provider: opts.provider,
              model: opts.model,
              workdir: opts.workdir,
              sessionId: opts.parentSessionId,
              workerSessionId: node.id,
            })

            node.status = "completed"
            node.output = result
            outputs[node.id] = result
          } catch (err) {
            node.status = "failed"
            node.error = err instanceof Error ? err.message : String(err)
            errors[node.id] = node.error
          }
        })
      )
    }

    return { outputs, errors }
  }
}

import { z } from "zod"
import { decomposeTask, flattenTaskTree } from "../../agent/decomposition.js"
import { DAGOrchestrator, type DAGNode } from "../../agent/dag-orchestrator.js"
import { buildExplicitDAG, buildPlannerDAG, type PlannedTask } from "../../agent/planner-dag.js"
import { ProviderRegistry } from "../../provider/registry.js"
import { loadConfig } from "../../config/config.js"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

/** Runs an explicit or inferred dependency graph through the shared worker pool. */

const DEPTH_BY_COMPLEXITY = { simple: 1, moderate: 2, complex: 3 } as const
type OrchestrationComplexity = keyof typeof DEPTH_BY_COMPLEXITY

// Güvenlik: agentPool zaten cfg.agents.maxWorkers ile eşzamanlı worker sayısını
// sınırlıyor (subagent/critique ile paylaşılan aynı havuz). Bu ayrıca TOPLAM
// üretilen node sayısını sınırlar — havuz zamanla boşalsa bile tek bir
// orchestrate() çağrısının onlarca node'u kuyruğa almasını önler.
const MAX_LEAF_NODES = 12

function capComplexityToDepth(requested: OrchestrationComplexity, maxDepth: number): OrchestrationComplexity {
  if (DEPTH_BY_COMPLEXITY[requested] <= maxDepth) return requested
  if (maxDepth <= 1) return "simple"
  if (maxDepth === 2) return "moderate"
  return "complex"
}

async function listProjectFiles(workdir: string, limit = 500): Promise<string[]> {
  const files: string[] = []
  try {
    const glob = new Bun.Glob("**/*.{ts,tsx,js,jsx,py,go,rs,rb}")
    for await (const f of glob.scan({ cwd: workdir, onlyFiles: true, dot: false })) {
      if (f.includes("node_modules/") || f.includes(".git/")) continue
      files.push(f)
      if (files.length >= limit) break
    }
  } catch {
    // Glob taraması başarısız olursa (izin, IO vb.) boş liste ile devam et —
    // decomposeTask projectStructure olmadan da çalışabiliyor.
  }
  return files
}

function escapeAttr(value: string): string {
  return value.replace(/"/g, "&quot;")
}

export const orchestrateTool: ToolDef = {
  id: "orchestrate",
  timeoutMs: 900_000, // 15 dk — birden fazla paralel worker bitene kadar
  description: `Decompose a complex, multi-part objective into a task graph and run it with
parallel specialist workers — a deterministic alternative to manually spawning subagents one by one.

WHEN TO USE:
- The objective has clearly separable sub-parts (multiple independent dimensions, or multiple
  independent files/modules to process)
- You want structured, trackable parallel execution with unified failure handling

DO NOT USE FOR:
- Simple, single-focus tasks (use bash/read/edit or a single subagent directly)
- Tasks with tightly-coupled sequential steps (do them yourself in order)

Returns a merged <orchestration-result> containing each sub-task's output and any errors.`,

  parameters: z.object({
    objective: z.string().describe("The overall objective to decompose and execute"),
    complexity: z.enum(["simple", "moderate", "complex"]).default("moderate")
      .describe("How many independent sub-tasks to decompose into — simple: 1 worker, moderate: 2-3 parallel dimensions, complex: full project-wide hierarchy"),
    plan: z.array(z.object({
      id: z.string().min(1),
      description: z.string().min(1),
      agentType: z.enum(["explore", "code", "review", "test", "docs", "performance", "security", "debug", "refactor", "devops", "design", "data", "critic"]),
      dependencies: z.array(z.string()).optional(),
      fileScopes: z.array(z.string()).optional(),
      maxAttempts: z.number().int().min(1).max(4).optional(),
    })).max(MAX_LEAF_NODES).optional()
      .describe("Optional explicit dependency graph. Use dependencies for ordering and fileScopes to prevent conflicting parallel edits."),
  }),

  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const objective = String(args["objective"] ?? "").trim()
    const requestedComplexity = (String(args["complexity"] ?? "moderate")) as OrchestrationComplexity
    if (!objective) {
      return { output: "", error: "objective is required." }
    }

    const cfg = loadConfig(ctx.workdir)
    if (cfg.orchestration?.enabled !== true) {
      return {
        output: "",
        error: "Orchestration is disabled for this project. Enable it via .aurict/config.json → orchestration.enabled to use this tool.",
      }
    }

    const maxDepth = cfg.orchestration.maxDepth ?? DEPTH_BY_COMPLEXITY.complex
    const complexity = capComplexityToDepth(requestedComplexity, maxDepth)

    const projectStructure = complexity === "complex" ? await listProjectFiles(ctx.workdir) : undefined

    const explicitPlan = args["plan"] as PlannedTask[] | undefined
    const root = explicitPlan ? undefined : decomposeTask({
      task: objective,
      complexity,
      ...(projectStructure ? { projectStructure } : {}),
    })
    const leaves = root ? flattenTaskTree(root) : []

    if (!explicitPlan?.length && leaves.length === 0) {
      return { output: "", error: "Decomposition produced no executable sub-tasks." }
    }
    if ((explicitPlan?.length ?? leaves.length) > MAX_LEAF_NODES) {
      return {
        output: "",
        error: `Plan exceeds the safety cap of ${MAX_LEAF_NODES} sub-tasks. Narrow the objective or use complexity="simple"/"moderate".`,
      }
    }

    const dagNodes: DAGNode[] = explicitPlan?.length
      ? buildExplicitDAG(explicitPlan, objective)
      : buildPlannerDAG(leaves, objective)

    const provider = ctx.provider ?? (process.env["ANTHROPIC_API_KEY"] ? "anthropic" : "opencode")
    const model = ctx.model ?? ProviderRegistry.get(provider).defaultModel()

    try {
      const orchestrator = new DAGOrchestrator(dagNodes)
      const { outputs, errors } = await orchestrator.run({
        parentSessionId: ctx.sessionId,
        provider,
        model,
        workdir: ctx.workdir,
      })

      const sections = dagNodes.map((node) => {
        const output = outputs[node.id]
        const error = errors[node.id]
        return `<subtask id="${node.id}" type="${node.agentType}" desc="${escapeAttr(node.desc)}">\n${
          error ? `ERROR: ${error}` : (output ?? "(no output)")
        }\n</subtask>`
      })

      const errorCount = Object.keys(errors).length
      const resultXml = `<orchestration-result objective="${escapeAttr(objective)}" total="${dagNodes.length}" failed="${errorCount}">\n${sections.join("\n\n")}\n</orchestration-result>`

      if (errorCount === dagNodes.length) {
        return { output: resultXml, error: "All orchestrated sub-tasks failed." }
      }
      return { output: resultXml }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { output: "", error: `Orchestration failed: ${msg}` }
    }
  },
}

import type { CoreMessage } from "ai"
import { runAgent } from "../agent/loop.js"
import { agentPool } from "../agent/pool.js"
import { AGENT_TYPE_TOOLS } from "../agent/protocol.js"
import { ProviderRegistry } from "../provider/registry.js"
import type { AgentType } from "../agent/protocol.js"
import type { RecipeRunOptions, RecipeRunResult, RecipeStep } from "./types.js"

export async function runRecipe(opts: RecipeRunOptions): Promise<RecipeRunResult> {
  const { recipe, workdir } = opts
  const providerName = opts.provider ?? recipe.provider ?? "anthropic"
  const plugin       = ProviderRegistry.get(providerName)
  const modelId      = opts.model ?? recipe.model ?? plugin.defaultModel()

  const results: RecipeRunResult["steps"] = []
  // Conversation context — prompt steps birikimli mesajlar üzerinden çalışır
  let conversationHistory: CoreMessage[] = []

  for (let i = 0; i < recipe.steps.length; i++) {
    const step = recipe.steps[i]!

    if (step.parallel) {
      // Paralel blok: tüm alt adımları aynı anda çalıştır
      const parallelLabel = step.name ?? `Step ${i + 1}: parallel (${step.parallel.length} tasks)`
      opts.onStepStart?.(i, step)
      const parallelResults = await runParallelSteps(
        step.parallel, i, workdir, providerName, modelId,
        opts.onText,
      )
      results.push(...parallelResults)
      opts.onStepFinish?.(i, step, parallelResults.map(r => r.output).join("\n---\n"))
      continue
    }

    const stepName = step.name ?? labelStep(i, step)
    opts.onStepStart?.(i, step)

    if (step.agent && step.prompt) {
      // Subagent adımı — agentPool üzerinden bağımsız worker
      const result = await runAgentStep(step, workdir, providerName, modelId, opts.sessionId)
      opts.onStepFinish?.(i, step, result.output)
      results.push({ index: i, name: stepName, ...result })

      // Subagent sonucunu konuşma geçmişine enjekte et
      conversationHistory.push({ role: "user",      content: `[agent:${step.agent}] ${step.prompt}` })
      conversationHistory.push({ role: "assistant", content: result.output || "(no output)" })
    } else if (step.bash) {
      const result = await runBashStep(step.bash, workdir)
      opts.onStepFinish?.(i, step, result.output)
      results.push({ index: i, name: stepName, output: result.output, ...(result.error ? { error: result.error } : {}) })

      conversationHistory.push({ role: "user",      content: `[bash] ${step.bash}` })
      conversationHistory.push({ role: "assistant", content: result.error
        ? `Error: ${result.error}\n${result.output}`.trim()
        : result.output || "(no output)"
      })
    } else if (step.prompt) {
      conversationHistory.push({ role: "user", content: step.prompt })

      let stepOutput = ""
      try {
        const finish = await runAgent({
          provider: providerName,
          model:    modelId,
          workdir,
          messages: conversationHistory,
          ...(recipe.system ? { system: recipe.system } : {}),
          stream:   false,
          onText: (text) => {
            stepOutput += text
            opts.onText?.(text)
          },
        })

        conversationHistory = [...conversationHistory, ...finish.newMessages]
        opts.onStepFinish?.(i, step, stepOutput)
        results.push({ index: i, name: stepName, output: stepOutput })
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err)
        opts.onStepFinish?.(i, step, "")
        results.push({ index: i, name: stepName, output: "", error: errMsg })
      }
    }
  }

  const success = results.every(r => !r.error)
  return { steps: results, success }
}

async function runParallelSteps(
  steps:        RecipeStep[],
  parentIndex:  number,
  workdir:      string,
  providerName: string,
  modelId:      string,
  onText?:      (text: string) => void,
): Promise<RecipeRunResult["steps"]> {
  const promises = steps.map(async (step, j) => {
    const idx      = parentIndex * 1000 + j   // synthetic index
    const stepName = step.name ?? labelStep(j, step)

    if (step.agent && step.prompt) {
      const result = await runAgentStep(step, workdir, providerName, modelId)
      return { index: idx, name: stepName, ...result }
    } else if (step.bash) {
      const result = await runBashStep(step.bash, workdir)
      return { index: idx, name: stepName, output: result.output, ...(result.error ? { error: result.error } : {}) }
    } else if (step.prompt) {
      let output = ""
      try {
        const finish = await runAgent({
          provider: providerName,
          model:    modelId,
          workdir,
          messages: [{ role: "user", content: step.prompt }],
          stream:   false,
          onText:   (text) => { output += text; onText?.(text) },
        })
        return { index: idx, name: stepName, output }
      } catch (err) {
        return { index: idx, name: stepName, output: "", error: err instanceof Error ? err.message : String(err) }
      }
    }
    return { index: idx, name: stepName, output: "" }
  })

  return Promise.all(promises)
}

async function runAgentStep(
  step:         RecipeStep,
  workdir:      string,
  providerName: string,
  modelId:      string,
  sessionId?:   string,
): Promise<{ output: string; error?: string }> {
  const agentType   = (step.agent ?? "explore") as AgentType
  const allowedTools = AGENT_TYPE_TOOLS[agentType] ?? AGENT_TYPE_TOOLS["explore"]
  const id           = `recipe-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

  try {
    const result = await agentPool.spawn({
      id,
      agentType,
      desc:            step.name ?? `${agentType} agent`,
      prompt:          step.prompt!,
      provider:        providerName,
      model:           modelId,
      workdir,
      sessionId:       sessionId ?? "recipe",
      workerSessionId: `${id}-session`,
      allowedTools,
    })
    return { output: result }
  } catch (err) {
    // Pool dolu → senkron fallback
    const { runAgent } = await import("../agent/loop.js")
    try {
      const r = await runAgent({
        provider: providerName,
        model:    modelId,
        workdir,
        messages: [{ role: "user", content: step.prompt! }],
        stream:   false,
      })
      return { output: r.text }
    } catch (fallbackErr) {
      return { output: "", error: fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr) }
    }
  }
}

async function runBashStep(
  command: string,
  workdir: string,
): Promise<{ output: string; error?: string }> {
  try {
    const { spawn } = await import("bun")
    const proc   = spawn(["sh", "-c", command], { cwd: workdir, stdout: "pipe", stderr: "pipe" })
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()
    const code   = await proc.exited

    const output = [stdout, stderr].filter(Boolean).join("\n").trim()
    if (code !== 0) {
      return { output, error: `Exit code ${code}` }
    }
    return { output }
  } catch (err) {
    return { output: "", error: err instanceof Error ? err.message : String(err) }
  }
}

function labelStep(i: number, step: RecipeStep): string {
  if (step.agent)  return `Step ${i + 1}: ${step.agent} agent`
  if (step.bash)   return `Step ${i + 1}: bash`
  if (step.prompt) return `Step ${i + 1}: ${step.prompt.slice(0, 60)}${step.prompt.length > 60 ? "…" : ""}`
  return `Step ${i + 1}`
}

/** YAML string'i RecipeDef'e parse eder (yaml paketi yoksa JSON fallback) */
export async function parseRecipeFile(filePath: string): Promise<import("./types.js").RecipeDef> {
  const content = await Bun.file(filePath).text()

  if (filePath.endsWith(".json")) {
    return JSON.parse(content) as import("./types.js").RecipeDef
  }

  try {
    const yaml = await import("yaml" as never) as { parse: (s: string) => unknown }
    return yaml.parse(content) as import("./types.js").RecipeDef
  } catch {
    throw new Error(
      `YAML parsing requires the 'yaml' package.\n` +
      `Install it with: bun add yaml\n` +
      `Or save your recipe as .json instead.`
    )
  }
}

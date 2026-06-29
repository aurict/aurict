import { z } from "zod"
import { agentPool } from "../../agent/pool.js"
import { AGENT_TYPE_TOOLS } from "../../agent/protocol.js"
import { getCustomAgent } from "../../agent/custom.js"
import { ProviderRegistry } from "../../provider/registry.js"
import { SessionManager } from "../../session/manager.js"
import { loadConfig } from "../../config/config.js"
import { filterToolIdsForSecurityCapability, isAgentTypeVisibleForSecurityCapability } from "../../security/capability.js"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

const BUILT_IN_TYPES = ["explore", "code", "review", "test", "docs", "performance", "analytics", "security", "debug"] as const

export const taskTool: ToolDef = {
  id:          "task",
  timeoutMs:   600_000,  // 10 min for foreground tasks; background tasks return immediately
  description: "Spawn a specialized subagent. Built-in types: explore, code, review, test, docs, performance, analytics, security, debug. Custom agents: use the agent ID from .aurict/agents/*.md",
  parameters:  z.object({
    type:        z.string().describe("Agent type (built-in or custom agent ID from .aurict/agents/)"),
    description: z.string().describe("Short description of this agent's task (shown in UI)"),
    prompt:      z.string().describe("Detailed instructions for the subagent"),
    background:  z.boolean().optional().describe("If true, don't wait for result (fire and forget)"),
    model:       z.string().optional().describe("Override model (default: inherits from calling agent)"),
  }),

  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const typeArg     = String(args["type"] ?? "explore")
    const desc        = String(args["description"] ?? "")
    const prompt      = String(args["prompt"] ?? "")
    const background  = args["background"] === true
    const modelOverride = args["model"] as string | undefined

    // Built-in mi custom mi?
    const isBuiltIn    = (BUILT_IN_TYPES as readonly string[]).includes(typeArg)
    const customAgent  = isBuiltIn ? null : getCustomAgent(ctx.workdir, typeArg)

    if (!isBuiltIn && !customAgent) {
      return { output: "", error: `Bilinmeyen agent tipi: '${typeArg}'. Built-in: ${BUILT_IN_TYPES.join(", ")}` }
    }

    const cfg = loadConfig(ctx.workdir)
    const agentType = isBuiltIn
      ? typeArg as keyof typeof AGENT_TYPE_TOOLS
      : "explore" as keyof typeof AGENT_TYPE_TOOLS  // custom için fallback type
    if (!isAgentTypeVisibleForSecurityCapability(agentType, cfg)) {
      return { output: "", error: `Agent type '${agentType}' is unavailable because the security capability profile is disabled.` }
    }

    // Config veya custom agent'dan ayarları al
    const agentConfig  = customAgent
      ? { provider: customAgent.provider, model: customAgent.model, tools: customAgent.tools }
      : await loadAgentConfig(typeArg, ctx.workdir)

    const provider    = agentConfig?.provider ?? ProviderRegistry.detectDefault()
    const plugin      = ProviderRegistry.get(provider)
    const model       = modelOverride ?? agentConfig?.model ?? plugin.defaultModel()
    const allowedTools = filterToolIdsForSecurityCapability(agentConfig?.tools ?? AGENT_TYPE_TOOLS[agentType], cfg)

    // Custom agent'ın system prompt'unu prompt'a ekle
    const finalPrompt = customAgent?.system
      ? `${customAgent.system}\n\n---\n\n${prompt}`
      : prompt

    const workerSessionId = SessionManager.create(
      { provider, model },
      { title: `[${typeArg}] ${desc.slice(0, 50)}`, parentId: ctx.sessionId },
    )

    const agentId = crypto.randomUUID()

    if (background) {
      agentPool.spawn({
        id:              agentId,
        agentType,
        desc,
        prompt:          finalPrompt,
        provider,
        model,
        workdir:         ctx.workdir,
        sessionId:       ctx.sessionId,
        workerSessionId,
        allowedTools,
      }).catch((err) => {
        console.error(`[agent:${typeArg}] error: ${err.message}`)
      })

      return { output: `Agent '${typeArg}' başlatıldı (background). ID: ${agentId}` }
    }

    // Foreground: tamamlanmasını bekle
    try {
      const result = await agentPool.spawn({
        id:              agentId,
        agentType,
        desc,
        prompt:          finalPrompt,
        provider,
        model,
        workdir:         ctx.workdir,
        sessionId:       ctx.sessionId,
        workerSessionId,
        allowedTools,
      })
      return { output: result }
    } catch (err) {
      return {
        output: "",
        error:  `Agent '${typeArg}' başarısız: ${err instanceof Error ? err.message : String(err)}`,
      }
    }
  },
}

interface AgentConfig {
  provider?: string
  model?:    string
  tools?:    string[]
}

async function loadAgentConfig(type: string, workdir: string): Promise<AgentConfig | null> {
  try {
    const configPath = `${workdir}/.aurict/config.json`
    const raw  = await Bun.file(configPath).text()
    const cfg  = JSON.parse(raw) as Record<string, unknown>
    const agents = cfg["agents"] as Record<string, AgentConfig> | undefined
    return agents?.[type] ?? null
  } catch {
    return null
  }
}

import type { CoreMessage } from "ai"
import type { AgentFinishResult, AgentRunOptions } from "./types.js"
import { getAgentPrompt } from "./agent-prompts.js"
import { AGENT_MAX_STEPS, type WorkerMessage, type WorkerRequest } from "./protocol.js"

const INBOX_BATCH_STEPS = 8
const MAX_INBOX_TURNS = 8

export interface WorkerInboxMessage {
  from: string
  fromName: string
  message: string
}

export interface WorkerRuntimePort {
  runAgent(options: AgentRunOptions): Promise<AgentFinishResult>
  send(message: WorkerMessage): void
  signal: AbortSignal
  drainInbox(): WorkerInboxMessage[]
}

export async function runWorkerRequest(request: WorkerRequest, port: WorkerRuntimePort): Promise<void> {
  applyProviderEnvironment(request.envVars)
  const totalMaxSteps = AGENT_MAX_STEPS[request.agentType] ?? 30
  const system = buildWorkerSystem(request, totalMaxSteps)
  const taskPrompt = request.taskContext
    ? request.prompt
    : request.parentContext
      ? `## Parent Conversation Context\n\n${request.parentContext}\n\n---\n\n## Your Task\n\n${request.prompt}`
      : request.prompt
  const workerTaskContext = request.taskContext
    ? { ...request.taskContext, objective: request.prompt, updatedAt: Date.now() }
    : undefined

  let messages: CoreMessage[] = [{ role: "user", content: taskPrompt }]
  let stepsUsed = 0
  let inboxTurns = 0
  let finalText = ""
  let totalInput = 0
  let totalOutput = 0

  try {
    while (stepsUsed < totalMaxSteps) {
      if (port.signal.aborted) throw port.signal.reason
      const batchLimit = Math.min(INBOX_BATCH_STEPS, totalMaxSteps - stepsUsed)
      let batchToolCalls = 0
      let batchText = ""

      const result = await port.runAgent({
        runId: `${request.id}:${stepsUsed}`,
        sessionId: request.sessionId,
        provider: request.provider,
        model: request.model,
        workdir: request.workdir,
        system,
        messages,
        toolsOverride: request.allowedTools,
        signal: port.signal,
        coordinatorMode: false,
        ...(request.backendAccessToken !== undefined ? { backendAccessToken: request.backendAccessToken } : {}),
        ...(workerTaskContext ? { taskContext: workerTaskContext } : {}),
        runtime: {
          profile: "subagent",
          maxSteps: batchLimit,
          isSubagent: true,
          agentType: request.agentType,
          sendMessage: (to, message) => port.send({
            type: "send_message",
            to,
            message,
            from: request.id,
            fromName: request.agentName,
          }),
        },
        onText: (delta, isReasoning) => {
          if (isReasoning || !delta) return
          batchText += delta
          port.send({ type: "text", delta })
        },
        onToolCall: call => {
          batchToolCalls++
          port.send({ type: "tool_call", id: call.id, tool: call.tool, args: call.args })
        },
        onToolResult: resultEvent => port.send({
          type: "tool_result",
          id: resultEvent.id,
          result: resultEvent.result,
        }),
      })

      if (batchText) finalText = finalText ? `${finalText}\n\n${batchText}` : batchText
      totalInput += result.tokens.input
      totalOutput += result.tokens.output
      messages = [...messages, ...result.newMessages]
      stepsUsed += batchToolCalls

      const incoming = port.drainInbox()
      if (incoming.length > 0 && inboxTurns < MAX_INBOX_TURNS) {
        messages.push({ role: "user", content: formatInbox(incoming) })
        inboxTurns++
        continue
      }
      if (batchToolCalls === 0 || batchToolCalls < batchLimit) break
    }

    if (port.signal.aborted) throw port.signal.reason
    if (!finalText) finalText = "Subagent completed its tool work without a textual summary."
    port.send({ type: "done", result: finalText, tokens: { input: totalInput, output: totalOutput } })
  } catch (error) {
    port.send({
      type: "error",
      message: port.signal.aborted
        ? "Subagent cancelled"
        : error instanceof Error ? error.message : String(error),
    })
  }
}

function buildWorkerSystem(request: WorkerRequest, maxSteps: number): string {
  return [
    getAgentPrompt(request.agentType, maxSteps),
    `## Available Tools\nYou have access to ONLY these tools: ${request.allowedTools.join(", ")}.`,
    "## Agent Communication\nUse send_message to contact sibling agents. Incoming messages arrive between runtime batches.",
  ].join("\n\n---\n\n")
}

function formatInbox(messages: WorkerInboxMessage[]): string {
  return messages
    .map(item => `<agent-message from="${item.fromName}">\n${item.message}\n</agent-message>`)
    .join("\n\n")
}

function applyProviderEnvironment(values?: Record<string, string>): void {
  for (const [key, value] of Object.entries(values ?? {})) if (value) process.env[key] = value
}

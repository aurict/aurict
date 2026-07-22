import type { CoreMessage } from "ai"
import { getPromptCacheControl } from "./prompt-cache-control.js"
import { joinPromptSections, type ResolvedPromptSection } from "./prompt-sections.js"

export interface PromptCacheLayout {
  static: string
  session: string
  skills: string
  dynamic: string
}

export function buildPromptCacheLayout(sections: ResolvedPromptSection[]): PromptCacheLayout {
  return {
    static: joinPromptSections(sections.filter(section => section.cache === "static")),
    session: joinPromptSections(sections.filter(section => section.cache === "session" && section.name !== "skills")),
    skills: joinPromptSections(sections.filter(section => section.cache === "session" && section.name === "skills")),
    dynamic: joinPromptSections(sections.filter(section => section.cache === "dynamic")),
  }
}

export function withAnthropicHistoryBreakpoint(
  messages: CoreMessage[],
  enabled: boolean,
  excludeCurrentUser = false,
): CoreMessage[] {
  if (!enabled || messages.length === 0) return messages
  const index = findLastConversationMessage(messages, excludeCurrentUser)
  if (index < 0) return messages

  const message = messages[index]!
  const existing = (message.experimental_providerMetadata ?? {}) as Record<string, unknown>
  const anthropic = (existing["anthropic"] ?? {}) as Record<string, unknown>
  const annotated = {
    ...message,
    experimental_providerMetadata: {
      ...existing,
      anthropic: { ...anthropic, cacheControl: getPromptCacheControl() },
    } as never,
  } as CoreMessage
  const result = [...messages]
  result[index] = annotated
  return result
}

export function appendAnthropicDynamicContext(
  messages: CoreMessage[],
  dynamicContext: string,
): CoreMessage[] {
  if (!dynamicContext) return messages
  const contextMessage: CoreMessage = {
    role: "user",
    content: `<aurict-runtime-context>\n${dynamicContext}\n</aurict-runtime-context>`,
  }
  const last = messages.at(-1)
  if (last?.role !== "user") return [...messages, contextMessage]
  return [...messages.slice(0, -1), contextMessage, last]
}

function findLastConversationMessage(messages: CoreMessage[], excludeCurrentUser: boolean): number {
  const start = excludeCurrentUser && messages.at(-1)?.role === "user"
    ? messages.length - 2
    : messages.length - 1
  for (let index = start; index >= 0; index--) {
    if (messages[index]?.role !== "system") return index
  }
  return -1
}

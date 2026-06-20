---
name: ai-sdk-patterns
description: "Vercel AI SDK 4: streaming text, tool use, multi-step agents, structured output, provider switching."
triggers:
  deps: ["ai", "@ai-sdk/openai", "@ai-sdk/anthropic", "@ai-sdk/google"]
  directories: ["app/api/chat/", "src/lib/ai/"]
auto_load_when: "Building AI-powered features with the Vercel AI SDK"
tags: ["ai", "llm", "streaming", "tool-use", "vercel-ai-sdk"]
priority: 9
---

# Vercel AI SDK Patterns

## Quick Reference

```
Text stream:   streamText({ model, messages, tools })
Object stream: streamObject({ model, schema: z.object({...}), prompt })
One-shot:      generateText({ model, messages }) → { text, usage }
Structured:    generateObject({ model, schema, prompt }) → { object }
Multi-step:    streamText({ maxSteps: 5, tools }) → auto-calls tools until done
```

**Minimal streaming chat:**
```typescript
import { streamText } from "ai"
import { anthropic } from "@ai-sdk/anthropic"

export async function POST(req: Request) {
  const { messages } = await req.json()
  const result = streamText({ model: anthropic("claude-sonnet-4-5"), messages })
  return result.toDataStreamResponse()
}
```

---

## Decision Tree

```
Output type?
├── Text stream     → streamText() + toDataStreamResponse()
├── Typed object    → streamObject() with z.object schema
├── One-shot text   → generateText() (no streaming needed)
└── Typed one-shot  → generateObject()

Tools needed?
├── Simple tool      → tools: { toolName: tool({ description, parameters: z.object({...}), execute: async () => result }) }
├── Multi-step agent → maxSteps: N, tools with execute functions
├── User confirmation → tools without execute (model calls, user confirms, client sends result)
└── Parallel tools   → AI SDK handles parallel tool calls automatically

Provider choice?
├── Best reasoning → anthropic("claude-opus-4-5") or openai("o3")
├── Fast/cheap     → anthropic("claude-haiku-4-5") or openai("gpt-4o-mini")
├── Vision         → any model with vision support
└── Local          → ollama provider (no API key, offline)
```

---

## Anti-Patterns

- Manually parsing AI SDK stream responses — use `useChat` hook on client or `toDataStreamResponse()` on server
- Not setting `maxSteps` for tool-calling agents — defaults to 1, loops won't complete
- Blocking on `generateText` for UI-facing features — always stream for perceived performance
- Hardcoding model names in components — define model in one place, inject via config
- Not handling `finish_reason: "tool-calls"` for multi-step — SDK handles this automatically with `maxSteps`
- Sending entire conversation on every token — messages already include context; trust the SDK
- Missing `AbortSignal` for long-running streams — pass `request.signal` to allow client cancellation

---

## Key Rules

1. `useChat` for client-side chat UI — handles streaming, message state, input management
2. Tool `execute` = server-side execution; omit `execute` = client-side confirmation flow
3. `streamObject` requires Zod schema; partial objects streamed progressively
4. System prompt goes in `messages: [{ role: "system", content: "..." }, ...]`
5. Token tracking: `result.usage` has `{ promptTokens, completionTokens, totalTokens }`
6. Error handling: wrap in try/catch; AI SDK throws on API errors, rate limits, and network issues

---

## Implementation

**Tool-calling agent (multi-step):**
```typescript
const result = await streamText({
  model: openai("gpt-4o"),
  tools: {
    getWeather: tool({
      description: "Get current weather for a city",
      parameters: z.object({ city: z.string() }),
      execute: async ({ city }) => fetchWeather(city),
    }),
    searchWeb: tool({
      description: "Search the web",
      parameters: z.object({ query: z.string() }),
      execute: async ({ query }) => searchDuckDuckGo(query),
    }),
  },
  maxSteps: 5,
  messages,
})
```

**Structured generation with streaming:**
```typescript
const { partialObjectStream } = streamObject({
  model: anthropic("claude-sonnet-4-5"),
  schema: z.object({
    products: z.array(z.object({ name: z.string(), price: z.number(), category: z.string() }))
  }),
  prompt: "List 5 popular TypeScript libraries",
})
for await (const partial of partialObjectStream) {
  console.log(partial.products?.length) // builds up as tokens arrive
}
```

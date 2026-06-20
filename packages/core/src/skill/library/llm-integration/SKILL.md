---
name: llm-integration
description: "LLM Integration: Anthropic Claude API, OpenAI, streaming, tool use, prompt caching, structured output, fallback strategies, cost optimization."
triggers:
  extensions: [".py", ".ts"]
  directories: ["ai/", "llm/", "models/"]
  keywords: ["openai", "anthropic", "llm", "gpt", "claude", "gemini", "huggingface", "createAnthropic", "anthropic.messages"]
auto_load_when: "Integrating LLMs or building AI-powered features"
agent: ai-engineer
tools: ["Read", "Write", "Bash"]
---

# LLM Integration Patterns

**Focus:** Anthropic Claude API, OpenAI, streaming, tool use, prompt caching, reliability, cost

## 1. LLM Selection Decision

```
Which LLM to use?
├── Simple tasks (summarization, classification) → Small/fast models
│   └── GPT-4o-mini, Claude Haiku, Gemini Flash
│
├── Complex reasoning → Large models
│   └── GPT-4, Claude Sonnet/Opus, Gemini Pro
│
├── Code generation → Specialized models
│   └── Codex, CodeLlama, Claude
│
├── Latency critical → Streaming + small model
│
└── Cost critical → Batch processing + smaller model
```

---

## 2. API Integration Patterns

```
LLM API Call Flow:
├── Request preparation
│   ├── Validate input (max length, content filtering)
│   ├── Build messages with system prompt
│   └── Add few-shot examples if needed
│
├── API call with retry
│   ├── Exponential backoff (1s, 2s, 4s, max 3 retries)
│   ├── Timeout: 30s for sync, handle async
│   └── Fallback to backup model on failure
│
├── Response processing
│   ├── Parse JSON if structured output needed
│   ├── Validate response format
│   └── Handle rate limits (429) with backoff
│
└── Error handling
    ├── Distinguish API error vs network error
    ├── Log for debugging (no sensitive data)
    └── Return graceful degradation
```

**Pattern - Structured Output:**
```python
# BAD - parsing unstructured text
response = llm.chat("Extract name and email from: " + text)
# Parse with regex = fragile

# GOOD - use structured output
response = llm.chat(
    messages,
    response_format={"type": "json_object", "schema": UserSchema}
)
```

---

## 3. Self-Hosted vs API

```
When to self-host:
├── Data privacy/sovereignty (healthcare, legal)
├── Custom fine-tuned models needed
├── Very high volume (cost optimization)
└── Offline/edge deployment

When to use API:
├── Rapid prototyping
├── General-purpose models sufficient
└── Low volume (< 1M tokens/day)

Hybrid: API for prod, self-hosted for sensitive data
```

---

## 4. Cost Optimization

```
Cost Components:
├── Input tokens (prompt)
│   ├── Truncate long documents
│   ├── Use summaries instead of full text
│   └── Cache common system prompts
│
├── Output tokens (completion)
│   ├── Max tokens limit for predictable costs
│   ├── Stream to show progress (perceived faster)
│   └── Temperature = 0 for deterministic tasks
│
└── API calls
    ├── Batch requests when possible
    └── Implement response caching for similar queries
```

---

## Key Patterns

1. **Fallback chain** - Primary → Backup → Third-party
2. **Streaming-first** - Show tokens as they arrive
3. **Structured output** - Use JSON schema, not parsing
4. **Cost tracking** - Log token usage per request
5. **Circuit breaker** - Stop calling after N failures

---

## Anti-Patterns

```
❌ No retry logic — single API call without handling failures
✅ Implement exponential backoff with circuit breaker

❌ Hardcoding API keys in source code
✅ Use environment variables, secret managers

❌ Sending unlimited context — context window has limits + cost
✅ Truncate, summarize, or use RAG to retrieve relevant chunks

❌ No response validation — blindly trusting LLM output
✅ Validate structure, sanitize before use

❌ Ignoring rate limits — getting 429 errors
✅ Implement backoff, use multiple API keys if needed
```

---

---

## 5. Anthropic Claude API (TypeScript)

```ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Basic message
const message = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Explain quantum entanglement simply.' }],
});
console.log(message.content[0].text);

// Streaming
const stream = await client.messages.stream({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  messages: [{ role: 'user', content: prompt }],
});
for await (const chunk of stream) {
  if (chunk.type === 'content_block_delta') process.stdout.write(chunk.delta.text);
}

// Prompt caching (reduces cost 90% for repeated system prompts)
const cachedMessage = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  system: [{
    type: 'text',
    text: longSystemPrompt,
    cache_control: { type: 'ephemeral' }, // cache for 5 minutes
  }],
  messages: [{ role: 'user', content: userQuestion }],
});

// Tool use (function calling)
const toolResult = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  tools: [{
    name: 'get_weather',
    description: 'Get current weather for a city',
    input_schema: {
      type: 'object',
      properties: { city: { type: 'string' } },
      required: ['city'],
    },
  }],
  messages: [{ role: 'user', content: 'What is the weather in Istanbul?' }],
});
// Check for tool use in response
if (toolResult.stop_reason === 'tool_use') {
  const toolUse = toolResult.content.find(b => b.type === 'tool_use');
  // Call your actual function with toolUse.input
}
```

---

## 6. Model Selection Guide

| Model | Best For | Cost |
|-------|----------|------|
| `claude-opus-4-8` | Complex reasoning, analysis, coding | Highest |
| `claude-sonnet-4-6` | Balanced — production default | Medium |
| `claude-haiku-4-5` | Fast responses, classification, summaries | Lowest |
| `gpt-4o` | OpenAI ecosystem, vision | Medium |
| `gpt-4o-mini` | Simple tasks, high volume | Low |

---

## Quick Reference

| Scenario | Solution | Tool/Pattern |
|---|---|---|
| Chat interface | Streaming response | `client.messages.stream()` |
| Repeated system prompts | Prompt caching | `cache_control: { type: 'ephemeral' }` |
| Function calling | Tool use | `tools` parameter + stop_reason check |
| Document Q&A | RAG pipeline | LangChain, LlamaIndex |
| Data extraction | Structured output | JSON schema + `tool_choice: required` |
| High volume | Prompt caching + batching | Anthropic Batch API |
| Low latency | Haiku + caching | claude-haiku-4-5 |
| Sensitive data | Self-hosted | Ollama, vLLM |

---

## Decision Tree

```
Which model?
├── Fast + cheap (classify, summarize, format) → claude-haiku-4-5
├── Balanced production workload               → claude-sonnet-4-6 (default)
├── Complex reasoning / long analysis          → claude-opus-4-8
└── OpenAI ecosystem dependency                → gpt-4o / gpt-4o-mini

Streaming or sync?
├── Chat UI / real-time display                → stream (shows tokens as they arrive)
├── Background job / batch processing          → sync (simpler, easier to log)
└── Structured extraction                      → sync + tool_choice: 'required'

Structured output strategy?
├── Need typed response (extract fields)       → tool_choice: 'required' + single tool
├── JSON schema enough                         → response_format: { type: 'json_object' }
└── Free-form text with format instructions   → system prompt (fragile, avoid if possible)

Same system prompt repeated?
├── Long system prompt (> 1 000 tokens)        → cache_control: { type: 'ephemeral' } (90% cost reduction)
└── Short system prompt                        → no caching needed
```

---

## Key Rules

1. Retry with exponential backoff on 429/529 — never give up on first error
2. Prompt caching for any system prompt > 1 000 tokens — 90% input cost reduction
3. Validate / parse LLM output before using — never trust raw text as structured data
4. Use `tool_choice: 'required'` + single tool for reliable structured extraction
5. Truncate context aggressively — LLMs degrade with >50% of context window filled
6. Log token usage per request for cost tracking (`usage.input_tokens` + `output_tokens`)
7. Circuit breaker: stop calling after 3 consecutive failures, surface error to user

---

## Implementation

```typescript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Retry wrapper with exponential backoff
async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try { return await fn() } catch (err: any) {
      if (i === maxRetries - 1) throw err
      const isRetryable = err.status === 429 || err.status === 529 || err.status >= 500
      if (!isRetryable) throw err
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000))
    }
  }
  throw new Error('unreachable')
}

// Structured extraction via tool use (most reliable)
const result = await callWithRetry(() =>
  client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    tools: [{
      name: 'extract_invoice',
      description: 'Extract invoice fields from text',
      input_schema: {
        type: 'object' as const,
        properties: {
          amount:   { type: 'number' },
          currency: { type: 'string' },
          dueDate:  { type: 'string', description: 'ISO 8601 date' },
        },
        required: ['amount', 'currency'],
      },
    }],
    tool_choice: { type: 'required' },
    messages: [{ role: 'user', content: `Extract from: ${rawInvoiceText}` }],
  })
)
const toolUse = result.content.find(b => b.type === 'tool_use')
const invoice = toolUse?.input  // typed as your schema

// Prompt caching for repeated large system prompts
async function chat(userMessage: string) {
  return client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: [{ type: 'text', text: LARGE_SYSTEM_PROMPT,
      cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userMessage }],
  })
}
```

# Hook System

OmniCod provides a hook system that lets you react to agent lifecycle events — from outside the agent loop. Hooks are synchronous or async functions registered at startup.

## Available hooks

| Hook | Payload | Fired when |
|------|---------|------------|
| `v1.tool.before` | `{ tool, args }` | Before any tool executes |
| `v1.tool.after` | `{ tool, args, result, durationMs }` | After any tool executes |
| `v1.tool.error` | `{ tool, args, error, durationMs }` | When a tool returns an error |
| `v1.context.inject` | `{ skillIds }` | When skills are being selected — can add/remove skill IDs |
| `v1.session.compact` | `{ sessionId, tokensBefore, tokensAfter }` | After context compaction |
| `v1.compact.before` | `{ sessionId, tokenCount }` | Before compaction starts |
| `v1.compact.after` | `{ sessionId, tokensBefore, tokensAfter }` | After compaction ends |

---

## Registering hooks in code

```typescript
import { onToolBefore, onToolAfter, onCompact, onSessionStart, onAgentComplete } from "@omnicod/core"

// Log every bash command
onToolBefore(async ({ tool, args }) => {
  if (tool === "bash") {
    console.log(`[hook] bash: ${args.command}`)
  }
})

// Alert on errors
onToolAfter(async ({ tool, result, durationMs }) => {
  if (result.error) {
    console.error(`[hook] ${tool} failed in ${durationMs}ms: ${result.error}`)
  }
})

// Modify args before execution
onToolBefore(async (payload) => {
  if (payload.tool === "bash" && String(payload.args.command).includes("rm -rf")) {
    // Return modified payload to change args, or throw to block
    throw new Error("rm -rf blocked by hook")
  }
})
```

---

## User hooks (shell scripts)

You can define hooks as shell commands in `~/.omnicod/hooks.json`:

```json
{
  "v1.tool.after": [
    {
      "match": { "tool": "write" },
      "command": "echo 'File written: {{args.path}}' >> ~/.omnicod/write-log.txt"
    }
  ],
  "v1.session.compact": [
    {
      "command": "notify-send 'OmniCod' 'Context compacted ({{tokensAfter}} tokens)'"
    }
  ]
}
```

Template variables (`{{field}}`) are replaced with values from the hook payload.

---

## Hook for skill injection

The `v1.context.inject` hook lets external systems add or remove skill IDs before skills are loaded:

```typescript
import { hooks } from "@omnicod/core"

hooks.on("v1.context.inject", async (payload) => {
  // Always include the team conventions skill
  return { ...payload, skillIds: [...payload.skillIds, "custom:team-conventions"] }
})
```

---

## Blocking tool execution

Throw an error from `v1.tool.before` to block a tool from executing:

```typescript
onToolBefore(async ({ tool, args }) => {
  if (tool === "bash" && /DROP TABLE/i.test(String(args.command))) {
    throw new Error("Database-destructive commands are blocked in this environment")
  }
})
```

The error is returned to the model as a tool error, with the hint system appending an actionable message.

---

## Hook timeout

Hooks have a **5-second** timeout by default. Hooks that take longer are cancelled and their result is ignored (the tool still executes).

---

## Session lifecycle hooks

```typescript
import { onSessionStart, onAgentComplete } from "@omnicod/core"

onSessionStart(async ({ sessionId, provider, model }) => {
  console.log(`Session ${sessionId} started with ${provider}/${model}`)
})

onAgentComplete(async ({ sessionId, text, tokens }) => {
  console.log(`Agent finished. ${tokens.output} output tokens.`)
})
```

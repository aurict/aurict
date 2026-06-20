# HTTP API Reference

Aurict exposes a local HTTP API on `localhost:4111` (configurable). All endpoints require a bearer token.

## Authentication

The token is auto-generated at `~/.aurict/server-token` on first run.

```bash
TOKEN=$(cat ~/.aurict/server-token)
curl -H "Authorization: Bearer $TOKEN" http://localhost:4111/health
```

---

## Endpoints

### `GET /health`

Returns server status.

```json
{ "status": "ok", "version": "1.0.3" }
```

---

### `GET /sessions`

List all sessions.

```json
[
  {
    "id": "sess_abc123",
    "createdAt": "2026-01-15T10:30:00Z",
    "provider": "anthropic",
    "model": "claude-sonnet-4-6",
    "messageCount": 24,
    "tokens": { "input": 45000, "output": 8200 }
  }
]
```

---

### `GET /sessions/:id`

Get a specific session.

---

### `GET /sessions/:id/messages`

Get all messages in a session.

```json
[
  { "role": "user", "content": "Refactor the auth middleware" },
  { "role": "assistant", "content": "I'll start by reading the current implementation..." }
]
```

---

### `POST /sessions/:id/messages`

Send a message to a session and get a response.

**Request:**
```json
{
  "content": "What does the database schema look like?",
  "stream": false
}
```

**Response:**
```json
{
  "role": "assistant",
  "content": "The database has 5 tables...",
  "tokens": { "input": 1200, "output": 340 }
}
```

**Streaming response** (`"stream": true`):

Returns Server-Sent Events:

```
data: {"type":"text","delta":"The database"}
data: {"type":"text","delta":" has 5 tables"}
data: {"type":"tool_call","tool":"read","args":{"path":"src/db/schema.ts"}}
data: {"type":"tool_result","tool":"read","output":"..."}
data: {"type":"done","tokens":{"input":1200,"output":340}}
```

---

### `POST /sessions`

Create a new session.

**Request:**
```json
{
  "provider": "anthropic",
  "model": "claude-sonnet-4-6",
  "workdir": "/path/to/project",
  "system": "Optional additional system prompt"
}
```

**Response:**
```json
{
  "id": "sess_xyz789",
  "createdAt": "2026-01-15T10:35:00Z"
}
```

---

### `DELETE /sessions/:id`

Delete a session and its messages.

---

### `GET /sessions/:id/stream`

SSE stream for real-time updates from an active session.

```
event: text
data: {"delta":"..."}

event: tool_call
data: {"tool":"bash","args":{"command":"bun test"}}

event: tool_result
data: {"tool":"bash","result":"..."}

event: done
data: {"tokens":{"input":2000,"output":500}}
```

---

### `GET /tools`

List all available tools (built-in + MCP).

```json
[
  { "id": "read",     "description": "Read a file or line range", "riskLevel": "safe" },
  { "id": "write",    "description": "Write content to a file",   "riskLevel": "medium" },
  { "id": "bash",     "description": "Execute a shell command",   "riskLevel": "variable" },
  { "id": "github__create_issue", "description": "Create a GitHub issue", "source": "mcp:github" }
]
```

---

### `GET /models`

List all available models across configured providers.

```json
[
  { "provider": "anthropic", "id": "claude-sonnet-4-6", "contextWindow": 200000 },
  { "provider": "openai",    "id": "gpt-4o",            "contextWindow": 128000 }
]
```

---

### `GET /memories`

List stored memories for a project.

**Query params:** `workdir=<path>`

```json
[
  { "id": 1, "category": "preference", "content": "User prefers bun over npm", "scope": "global" },
  { "id": 2, "category": "project",    "content": "Database schema is in src/db/schema.ts", "scope": "project" }
]
```

---

## Using the API from scripts

```bash
#!/usr/bin/env bash
TOKEN=$(cat ~/.aurict/server-token)
BASE="http://localhost:4111"

# Create a session
SESS=$(curl -s -X POST "$BASE/sessions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider":"anthropic","model":"claude-sonnet-4-6","workdir":"/my/project"}' \
  | jq -r '.id')

# Send a message
curl -s -X POST "$BASE/sessions/$SESS/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"List all TODO comments in the codebase","stream":false}' \
  | jq -r '.content'
```

---

## SDK usage

```typescript
import { createApp } from "@aurict/core"

const app = createApp()
const server = Bun.serve({ port: 4111, fetch: app.fetch })
```

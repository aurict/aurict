# Local HTTP API Reference

Aurict is terminal-first, but the CLI starts a local HTTP/SSE API for sessions,
provider metadata, MCP management, and SDK integrations.

Default bind address: `127.0.0.1:7777`.

All endpoints are under `/v1`. The bearer token is generated at
`~/.aurict/server-token` on first run and is required for every endpoint except
`GET /v1/health`.

```bash
TOKEN=$(cat ~/.aurict/server-token)
BASE="http://127.0.0.1:7777"
```

---

## Health

### `GET /v1/health`

Returns server status.

```bash
curl "$BASE/v1/health"
```

```json
{ "status": "ok", "version": "0.0.1" }
```

---

## Providers

### `GET /v1/provider`

Lists configured providers, their default model, and available model ids.

```bash
curl "$BASE/v1/provider" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Sessions

### `GET /v1/session`

Lists sessions known to the local session manager.

```bash
curl "$BASE/v1/session" \
  -H "Authorization: Bearer $TOKEN"
```

### `POST /v1/session`

Creates a session.

```bash
curl -X POST "$BASE/v1/session" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "anthropic",
    "model": "claude-sonnet-4-6",
    "title": "Refactor auth",
    "system": "Optional additional system prompt"
  }'
```

Response:

```json
{ "id": "sess_abc123" }
```

### `GET /v1/session/:id`

Returns a single session record.

```bash
curl "$BASE/v1/session/<id>" \
  -H "Authorization: Bearer $TOKEN"
```

### `POST /v1/session/:id/message`

Adds a user message and streams the assistant response as Server-Sent Events.

```bash
curl -N -X POST "$BASE/v1/session/<id>/message" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"List the risky files touched by the last change"}'
```

Example stream:

```text
data: {"type":"text","delta":"I will inspect the recent diff."}
event: done
data: {"type":"done","tokens":{"input":1200,"output":240}}
```

### `GET /v1/session/:id/events`

Subscribes to structured session events emitted by the local runtime.

```bash
curl -N "$BASE/v1/session/<id>/events" \
  -H "Authorization: Bearer $TOKEN"
```

Event payloads may include:

```json
{ "type": "text", "data": { "delta": "...", "sessionId": "sess_abc123" } }
{ "type": "tool_call", "data": { "id": "call_1", "tool": "read", "args": { "path": "src/index.ts" } } }
{ "type": "tool_result", "data": { "id": "call_1", "result": "...", "status": "ok" } }
{ "type": "permission", "data": { "id": "perm_1", "tool": "bash", "pattern": "npm install" } }
{ "type": "done", "data": { "sessionId": "sess_abc123" } }
```

---

## MCP

### `GET /v1/mcp`

Lists connected MCP servers.

```bash
curl "$BASE/v1/mcp" \
  -H "Authorization: Bearer $TOKEN"
```

### `POST /v1/mcp`

Connects an MCP server.

```bash
curl -X POST "$BASE/v1/mcp" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "filesystem",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
  }'
```

### `DELETE /v1/mcp/:name`

Disconnects an MCP server.

```bash
curl -X DELETE "$BASE/v1/mcp/filesystem" \
  -H "Authorization: Bearer $TOKEN"
```

---

## SDK

```typescript
import { AurictClient } from "@aurict/sdk"

const client = new AurictClient({
  baseUrl: "http://127.0.0.1:7777",
  token: process.env.AURICT_TOKEN,
})

const sessionId = await client.createSession({
  provider: "anthropic",
  model: "claude-sonnet-4-6",
})

await client.sendMessage(sessionId, {
  content: "Summarize this repo",
  onText: (delta) => process.stdout.write(delta),
  onDone: (tokens) => console.log(tokens),
})
```

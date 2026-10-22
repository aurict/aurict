# Aurict app-server plan

Status: proposal (2026-10-22). Goal: one runtime protocol that the terminal UI,
headless runs, the desktop app (Hoprel) and future IDE/mobile clients all drive,
the way OpenAI Codex uses `codex app-server`. Each client keeps its own Aurict
layout and language; only the wire model is shared.

## Why

Today `@aurict/core` is reached three different ways:

| Client | Path | Limits |
|---|---|---|
| TUI | calls `runAgent` in-process (`packages/cli/src/tui/hooks/useAgentSubmit.ts`) | state lives in React; commands depend on TUI context |
| Desktop | hand-written JSON lines (`packages/cli/src/ipc-server.ts`) | one global `history`/`sessionId`, one active turn, per-type response queues |
| HTTP | Hono REST + SSE (`packages/core/src/server/hono.ts`) | text-only stream, separate session model |

Features users ask for — parallel sessions, background/scheduled runs, per-turn
diffs, undo, approvals routed to the right chat — all need a thread-scoped model
that none of these paths has.

## Reference: Codex

- `codex app-server`: JSON-RPC 2.0 (the `jsonrpc` field omitted), stdio by default, experimental WebSocket and unix socket.
- Handshake: `initialize` → `initialized`, client capabilities, protocol v1/v2.
- Model: **thread** (conversation) → **turn** (one request + work) → **item** (`userMessage`, `agentMessage`, `reasoning`, `plan`, `commandExecution`, `fileChange`, `mcpToolCall`, `contextCompaction`, …).
- Notifications: `turn/started|completed`, `item/started|completed`, `item/*/delta`, `turn/diff/updated`, `turn/plan/updated`, `thread/tokenUsage/updated`.
- Server → client requests: command / file-change approvals carrying `threadId`, `turnId`, `itemId`.
- Many threads loaded at once; requests are serialized per thread, not globally.
- TS types and JSON Schema are generated from one source and committed as fixtures.
- The TUI and `exec` use an in-process client of the same server.

## Gaps in Aurict

| Capability | Needed |
|---|---|
| Envelope | JSON-RPC `id` / `result` / `error` instead of `{type}` + per-type queues |
| Handshake | `initialize` with `protocolVersion` and capabilities |
| Threads | a ThreadManager keyed by `threadId` (history, abort controller, model per thread) |
| Items | typed items with stable ids; tool calls mapped to `commandExecution` / `fileChange` / `mcpToolCall` |
| Diff / plan | turn-level aggregated diff from snapshots; plan from `taskManager` |
| Approvals | thread-scoped server requests; `PermissionRequest` in core has no `sessionId` today |
| Approval modes | Ask / Project auto / Full access (TUI-only today) as turn fields |
| Persistence | user prompts are not written to session parts (only the assistant reply is) |
| Checkpoints | per-turn `snapshotManager.mark` in every client; snapshot history cap shifts marks |
| MCP | sidecar never calls `mcpManager.init`; no persisted add/remove (added 2026-10-22) |
| Types | one schema source → generated TS for desktop and CLI |

## Phases

1. **Protocol package** `@aurict/app-protocol`: zod schemas for `initialize`, `thread/*`, `turn/*`, item and turn notifications, approval requests; generated TS + JSON Schema with snapshot tests. Aurict-only extensions stay namespaced (`design/*`, `memory/*`, `artifact/*`, `remote/*`, `skills/*`, `mcpServer/*`, `git/*`).
2. **Server** `packages/app-server` on `@aurict/core`: ThreadManager, per-thread queues, ExecutorEvents → items adapter, user-prompt persistence, per-turn checkpoints and diff. Transports: stdio JSONL and in-process. Golden transcript tests with a fake provider.
3. **Desktop**: sidecar runs `aurict app-server --listen stdio`; main process becomes a JSON-RPC client; renderer moves to threads/items (parallel sessions, background runs, scheduler). Keep `--ipc-server` behind a flag for one release.
4. **TUI and headless** on the in-process client; approval modes become turn fields; slash commands become server methods where they are not purely visual.
5. **Optional**: WebSocket/unix transport with token auth replacing Hono REST/SSE; remote and mobile clients.

## Risks

- Event fidelity: core emits no item ids or file-change events today.
- Approval richness: `allow_partial` and patch selection need a richer decision than Codex's.
- Shared process state (`PermissionGate`, provider/model, `taskManager.activeScope`) must become thread-scoped.
- Two protocols live during the transition.
- Scope: copy methods selectively; Codex exposes ~270.

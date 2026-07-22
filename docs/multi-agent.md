# Multi-Agent Mode

## Overview

Aurict runs long tasks by distributing work across a pool of typed specialist agents. Each agent runs in an isolated Bun Worker thread with its own tool scope and context budget. Main and worker agents use the same `AgentRuntime`; the Worker layer only adapts heartbeat, inbox, and pool messages. See [Agent Runtime](./agent-runtime.md).

```
User request
     │
     ▼
┌─────────────────┐
│   Coordinator   │  Decomposes task, routes to workers, merges results
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌──────┐  ┌──────────┐
│ code │  │  review  │  ... up to 8 concurrent workers
└──────┘  └──────────┘
```

---

## Agent types

| Type | Tools available | Best for |
|------|----------------|----------|
| `code` | read, write, edit, bash, glob, grep, lsp | Implementation, refactoring |
| `review` | read, glob, grep, lsp | Code review, auditing |
| `test` | read, glob, grep, bash, verify | Running and evaluating tests |
| `docs` | read, write, glob | Documentation generation |
| `debug` | read, bash, grep, glob, lsp | Debugging, tracing errors |
| `security` | read, grep, glob, security tools | Security audits and controlled scans |
| `performance` | read, bash, grep, glob | Performance analysis |
| `analytics` | read, grep, webfetch | Data analysis, metrics |
| `explore` | read, glob, grep | Codebase exploration |

---

## Coordinator mode

Enable coordinator mode to have the main agent act as a task decomposer and orchestrator:

```
/coordinator
```

Or from the command line:

```bash
aurict --coordinator
```

In coordinator mode:
1. The main agent receives your request
2. It breaks the task into subtasks
3. Each subtask is dispatched to the appropriate worker type
4. Worker results flow back to the coordinator
5. The coordinator synthesizes the final response

---

## Spawning agents inline

Any agent can spawn a subagent using the `subagent` tool:

```
Spawn a security agent to audit src/auth/ for injection vulnerabilities
```

The subagent runs with restricted tools (based on type), executes in its own thread, receives structured task context, and returns through the same versioned runtime event contract as the main agent.

---

## Agent pool

The pool manages up to 8 concurrent workers per parent session. Worker names and broadcasts are scoped to that parent session, and each worker is terminated when its task completes.

```bash
# View pool status
/agents
```

Worker timeout: **5 minutes** per task. Long-running tasks should be broken into smaller subtasks by the coordinator.

The `orchestrate` tool accepts an explicit DAG (`id`, `dependencies`,
`fileScopes`, and per-node `maxAttempts`) or infers dependencies from the
decomposed roles. Independent branches continue if another branch fails; only
transitive dependents are marked blocked. Runnable nodes with overlapping file
scopes are serialized to avoid concurrent edits, while disjoint scopes run in
parallel. Node state is mirrored into the session-scoped task store.

---

## Custom agents

Define custom agent types in `<workdir>/.aurict/agents.json`:

```json
[
  {
    "id": "migration",
    "name": "Migration Agent",
    "description": "Handles database migrations safely",
    "tools": ["read", "write", "edit", "bash"],
    "systemPrompt": "You are a database migration specialist. Always generate reversible migrations. Test on a backup before applying to production.",
    "maxSteps": 15
  }
]
```

Invoke with:

```
/agent migration Rename the 'users' table to 'accounts' and update all references
```

---

## Undercover mode

For monorepos with their own AI conventions (e.g., a repo that already has an `AGENTS.md` defining specific agent behavior), Aurict detects this and runs in undercover mode — respecting the existing conventions without overriding them.

```bash
aurict --undercover
```

---

## Project Auto mode

The TUI asks whether to enable Project Auto when Aurict opens in a folder. It can also be toggled
during the session:

```
/auto
```

Project Auto skips repeated prompts only for bounded typed file changes inside that project.
Shell commands, secrets, internal paths, project escapes, dangerous operations, and broad deletes
still require explicit approval. The grant is session-scoped and is reset when the workdir changes.

---

## Background tasks

Run an independent task in the background without sharing the active conversation's stream or session state:

```
/background run Inspect the repository and report the test failures
```

Use `/background` to list tasks, `/background <id>` to inspect output, and `/background cancel <id>` to stop a running task.

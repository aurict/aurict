# Multi-Agent Mode

## Overview

Aurict runs long tasks by distributing work across a pool of typed specialist agents. Each agent runs in an isolated Bun Worker thread with its own tool scope, system prompt, and context window.

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
| `test` | read, write, edit, bash | Writing and running tests |
| `docs` | read, write, glob | Documentation generation |
| `debug` | read, bash, grep, glob, lsp | Debugging, tracing errors |
| `security` | read, grep, glob | Security audits |
| `performance` | read, bash, grep, glob | Performance analysis |
| `analytics` | read, bash, grep | Data analysis, metrics |
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

The subagent runs with restricted tools (based on type), executes in its own thread, and returns a structured result.

---

## Agent pool

The pool manages up to 8 concurrent workers. Workers are reused across tasks within a session.

```bash
# View pool status
/agents
```

Worker timeout: **5 minutes** per task. Long-running tasks should be broken into smaller subtasks by the coordinator.

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

## Autopilot mode

In autopilot mode, Aurict executes multi-step tasks without asking for confirmation on safe operations:

```
/autopilot
```

Autopilot respects the permission system — dangerous operations (destructive bash commands, force pushes) still require explicit approval.

---

## Background tasks

Long tasks can be moved to the background:

```
/background
```

Running this while a task is in progress detaches it. Check status with `/background` when idle, and pick up results when they complete.

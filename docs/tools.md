# Tools Reference

OmniCod provides a typed, permission-controlled tool layer. Every tool call goes through:

1. **Zod schema validation** — args are validated before execution
2. **GateGuard** — path-based protection rules
3. **Permission evaluator** — allow / ask / deny decision
4. **Timeout protection** — 2-minute default per tool call
5. **Post-processing** — error hints, output summarization, TypeScript verification

---

## Built-in tools

### `read`
Read a file or a line range within a file.

| Param | Type | Description |
|-------|------|-------------|
| `path` | string | Absolute or relative path |
| `start_line` | number? | First line to read (1-indexed) |
| `end_line` | number? | Last line to read (inclusive) |

**Permission:** always-allow (safe)

---

### `write`
Write content to a file, creating it or overwriting it completely.

| Param | Type | Description |
|-------|------|-------------|
| `path` | string | Target file path |
| `content` | string | Full content to write |

**Permission:** ask (medium risk)

**Pre-checks:**
- GateGuard path protection
- Symbol pre-verification: named imports from existing local modules are verified before writing TypeScript/JavaScript files

---

### `edit`
Replace an exact string in an existing file.

| Param | Type | Description |
|-------|------|-------------|
| `path` | string | File to edit |
| `old_string` | string | Exact string to replace (must be unique in the file) |
| `new_string` | string | Replacement string |

**Permission:** ask (medium risk)

**Robustness features:**
- If `old_string` not found: error message tells the model it likely pattern-completed and must re-read the file
- Re-read gate: if the file hasn't been read in the last 10 tool calls, current content is injected and edit is deferred

---

### `bash`
Execute a shell command.

| Param | Type | Description |
|-------|------|-------------|
| `command` | string | Shell command to run |
| `timeout` | number? | Max milliseconds (default: 120 000) |

**Permission:** safe commands auto-allow; warning requires approval; danger always asks

The command is classified by an AST-level bash analyzer before execution:
- **safe** — read-only (`ls`, `cat`, `grep`, `find`, `git status`, …)
- **warning** — writes or network (`npm install`, `git commit`, file writes)
- **danger** — destructive (`rm -rf`, `git reset --hard`, `dd`, format commands)

---

### `glob`
Find files matching a glob pattern.

| Param | Type | Description |
|-------|------|-------------|
| `pattern` | string | Glob pattern (e.g. `src/**/*.ts`) |
| `cwd` | string? | Base directory |

**Permission:** always-allow

---

### `grep`
Search for a regex pattern in files.

| Param | Type | Description |
|-------|------|-------------|
| `pattern` | string | Regex to search for |
| `path` | string? | File or directory to search |
| `flags` | string? | Regex flags (e.g. `i` for case-insensitive) |

**Permission:** always-allow

Output > 4 000 chars is automatically summarized: first 50 matches + file/count summary.

---

### `webfetch`
Fetch a URL and return its text content.

| Param | Type | Description |
|-------|------|-------------|
| `url` | string | URL to fetch |
| `format` | `"text"\|"markdown"` | Output format (default: `markdown`) |

**Permission:** ask

HTML is automatically stripped to readable text.

---

### `websearch`
Search the web.

| Param | Type | Description |
|-------|------|-------------|
| `query` | string | Search query |
| `limit` | number? | Max results (default: 5) |

**Permission:** ask

---

### `lsp`
Query a language server for diagnostics.

| Param | Type | Description |
|-------|------|-------------|
| `path` | string | File to check |
| `language` | string? | Language ID (auto-detected from extension) |

**Permission:** always-allow

Supports TypeScript, JavaScript, Python, and any other LSP-capable language installed.

---

### `todo`
Manage the project-local task list.

| Param | Type | Description |
|-------|------|-------------|
| `action` | `"add"\|"list"\|"done"\|"delete"` | Operation |
| `text` | string? | Task text (for `add`) |
| `id` | string? | Task ID (for `done`/`delete`) |

Tasks persist to `<workdir>/.omnicod/todos.json`.

---

### `apply_patch`
Apply a unified diff patch to a file.

| Param | Type | Description |
|-------|------|-------------|
| `path` | string | File to patch |
| `patch` | string | Unified diff content |

**Permission:** ask

---

### `subagent`
Spawn a typed specialist agent inline and collect its output.

| Param | Type | Description |
|-------|------|-------------|
| `type` | string | Agent type: `code`, `review`, `test`, `docs`, `debug`, `security`, `performance`, `analytics`, `explore` |
| `task` | string | Task description |
| `tools` | string[]? | Restrict to specific tools |

**Permission:** warning-level (spawns a worker thread)

---

### `undo`
Roll back the last N agent steps.

| Param | Type | Description |
|-------|------|-------------|
| `steps` | number? | How many steps to roll back (default: 1) |

---

### `git`
Run git commands with enhanced safety.

| Param | Type | Description |
|-------|------|-------------|
| `command` | string | Git subcommand and args |

Destructive git commands (`reset --hard`, `push --force`, `branch -D`) require user confirmation.

---

## Custom tools

You can add custom tools in `~/.omnicod/tools/` or `<workdir>/.omnicod/tools/`. Each tool is a TypeScript file exporting a `ToolDef`:

```typescript
// ~/.omnicod/tools/deploy.ts
import { z } from "zod"
import type { ToolDef } from "@omnicod/core"

export const tool: ToolDef = {
  id: "deploy",
  description: "Deploy the current build to staging",
  spec: { category: "action", riskLevel: "high", permissionSummary: "Deploy to staging" },
  parameters: z.object({
    env: z.enum(["staging", "canary"]).default("staging"),
  }),
  async execute(args) {
    // your deployment logic
    return { output: `Deployed to ${args.env}` }
  },
}
```

---

## Output summarization thresholds

| Tool | Threshold | Summarization |
|------|-----------|--------------|
| `grep` | 4 000 chars | First 50 matches + file/count summary |
| All others | 4 000 chars | Head 2 500 chars + tail 600 chars + omission notice |

---

## Error hint injection

Every tool error is analyzed and an actionable hint is appended:

| Error pattern | Hint |
|---------------|------|
| `ENOENT` / `no such file` | Verify path with `ls -la <parent-dir>` |
| `cannot find module` | Check path spelling, file existence, or build step |
| `TypeScript error` | Run `tsc --noEmit` for the full error list |
| `EADDRINUSE` | Find the process: `lsof -i :<port>` |
| `permission denied` | Check file/directory permissions |
| `command not found` | Check if binary is installed: `which <binary>` |
| `syntax error` | Check for mismatched quotes, braces, semicolons |
| `out of memory` / `killed` | Operation requires too much memory |

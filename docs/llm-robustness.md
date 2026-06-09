# LLM Robustness Layer

OmniCod is designed to produce reliable results even when using weaker, cheaper, or poorly-calibrated models. The robustness layer is a set of framework-level features that compensate for common LLM failure modes — so reliability doesn't depend entirely on model quality.

---

## Failure modes this addresses

| Failure mode | Description |
|---|---|
| **Pattern completion** | Model fills in code from training memory instead of reading the actual file |
| **Context drift** | Model loses track of a file's current state after many tool calls |
| **Symbol hallucination** | Model invents function/type names that don't exist in the codebase |
| **Stuck loops** | Model retries the same failing approach repeatedly |
| **Noisy context** | Long tool outputs crowd out relevant context |
| **Stale git state** | Model reasons about an outdated branch/status |
| **Memory loss on compaction** | Useful facts about the project disappear when context is summarized |

---

## A — Edit failure diagnosis

**Location:** `packages/core/src/tool/built-in/edit.ts`

When the `edit` tool fails because `old_string` doesn't match anything in the file, the error message now explicitly says:

> "You likely pattern-completed the content from memory instead of reading it. Use the `read` tool to see the actual current content, then retry with an exact verbatim match."

**Why this works:** Without this hint, a model that pattern-completed will often retry with another guess. With it, even weak models consistently call `read` next and then produce a correct edit.

---

## B — Re-read gating (10-call staleness window)

**Location:** `packages/core/src/agent/loop.ts` inside `buildAITools`

Every file read or write updates a `recentReads` map: `filePath → toolCallIndex`. When `edit` is called:

1. The call index is checked against the last read index for that file
2. If the difference exceeds **10 tool calls**, the edit is intercepted before execution
3. The current file content (up to 6 000 chars) is injected into the result
4. The model is told: "Review the actual content above, then re-issue your edit"

The edit is **not executed** — the model must retry after reviewing the fresh content.

```
call #1:  read("src/foo.ts")         → recentReads["src/foo.ts"] = 1
call #2:  bash("bun test")
call #3:  grep("someFunction")
...
call #12: edit("src/foo.ts", ...)    → last read was #1, diff=11 > 10
                                       → inject current content, defer edit
call #13: edit("src/foo.ts", ...)    → now model has fresh content → succeeds
```

**Staleness threshold:** 10 tool calls. This was chosen because most multi-file tasks take 5–8 tool calls between reading a file and editing it. A threshold of 10 catches drift while allowing normal workflows.

---

## C — Symbol pre-verification

**Location:** `packages/core/src/tool/executor.ts` in `verifyLocalImports`

Before executing `write` or `edit` on a TypeScript/JavaScript file, named imports from local modules are extracted and verified:

```typescript
// Model writes: import { phantomFn } from './utils'
// OmniCod checks: does './utils.ts' exist AND does it export 'phantomFn'?
// If file exists but export not found → block with diagnostic
```

**What is checked:**
- `import { X, Y } from './path'` — named imports from relative paths
- Up to 4 imports per write/edit (performance limit)
- Files up to 100 KB

**What is NOT checked (intentionally):**
- Node modules (`import { X } from 'react'`)
- Default imports (`import X from './path'`)
- Star imports (`import * as X from './path'`)
- Non-existent target files (the file may be created in the next step)

**Blocking condition:** The target file exists AND the named export is not found in it.

**Pass-through condition:** The target file doesn't exist yet — it may be created later in the same session.

---

## Dual-path TypeScript verification

**Location:** `packages/core/src/tool/executor.ts` — `runTscCheck` / `filterTscForFile`

After every successful `edit` or `write` on a typed file (`.ts`, `.tsx`, `.js`, `.jsx`, `.mts`, `.cts`):

1. `bunx tsc --noEmit --pretty false` is spawned asynchronously
2. Result is cached for 8 seconds (avoids hammering tsc on rapid edits)
3. Error lines containing the edited filename are extracted (max 12 lines)
4. If errors exist → appended to the tool result: `[TypeScript] Errors in this file after edit:`
5. If clean → `[TypeScript] ✓ No errors`

The model receives TypeScript feedback in the same tool result, without needing a separate check step.

---

## Stuck detection

**Location:** `packages/core/src/agent/loop.ts` inside `buildAITools`

A `failureTracker: Map<string, number>` is maintained per `runAgent` call. For every tool error:

```
fingerprint = "<toolId>:<error_text_first_80_chars>"
```

If the same fingerprint appears **2 or more times in a row**, this is appended to the result:

> `[SYSTEM: You have hit this exact error N times in a row. DO NOT retry the same approach. Stop, identify the root cause, and try a fundamentally different solution.]`

This breaks stuck loops where a weak model keeps repeating the same failing command.

---

## Error analysis hints

**Location:** `packages/core/src/tool/executor.ts` — `analyzeToolError`

Every tool error string is inspected by regex patterns. If a known pattern matches, a one-line actionable hint is appended:

| Pattern | Hint injected |
|---------|---------------|
| `cannot find module` | "Module resolution failure — check path spelling, file existence, or whether a build step is needed." |
| `error TS\d+` or `.tsx?:\d+:\d+` | "TypeScript error — run 'tsc --noEmit' for the full error list before retrying." |
| `permission denied` / `EACCES` | "Permission denied — check file/directory permissions." |
| `command not found` (bash) | "Binary not in PATH — check if it's installed: which \<binary\>" |
| `EADDRINUSE` / `address already in use` | "Port already in use — find the process: lsof -i :\<port\>" |
| `ENOENT` / `no such file or directory` | "Path doesn't exist — verify with: ls -la \<parent-dir\>" |
| `syntax error` | "Syntax error — check for mismatched quotes, braces, or missing semicolons." |
| `out of memory` / `killed` | "Process killed (OOM or ulimit) — operation requires too much memory." |

---

## Output summarization

**Location:** `packages/core/src/tool/executor.ts` — `summarizeToolOutput`

Tool outputs exceeding 4 000 characters are automatically summarized before being returned to the model:

**grep results:**
```
<first 50 match lines>
[312 matches across 8 file(s) — showing first 50]
```

**General output:**
```
<first 2 500 chars>

[... 1 847 chars / 89 total lines omitted ...]

<last 600 chars>
```

This prevents large outputs (e.g. `find` results, test runner output, log files) from crowding out relevant context.

---

## Proactive file injection

**Location:** `packages/core/src/skill/injector.ts` — `buildProactiveFileSection`

When the user sends a message, file paths mentioned in it are detected by regex and resolved. Up to 3 matching files (up to 3 000 chars each, 6 000 chars total) are read and injected into the system prompt **before the model even calls `read`**.

This means the model starts with the relevant file content already in context — avoiding a round-trip tool call.

**Supported extensions:** `.ts`, `.tsx`, `.js`, `.jsx`, `.mts`, `.mjs`, `.py`, `.go`, `.rs`, `.md`, `.json`, `.yaml`, `.yml`, `.css`, `.html`, `.sh`, `.toml`, `.env`

**Example:** If the user says _"there's a bug in `src/api/router.ts`"_, the content of `router.ts` is injected before the first model call.

---

## Git context freshness

**Location:** `packages/core/src/agent/loop.ts` + `packages/core/src/skill/injector.ts`

The git section (branch, status, recent commits) is generated fresh on every turn and placed in a **separate, uncached system message block** for Anthropic providers.

This prevents the 5-minute Anthropic prompt cache from serving stale git state. The static system prompt (skills, memory, instructions) is cached normally; the git section is not.

For non-Anthropic providers, the full system prompt is regenerated each turn.

---

## Structured compaction

**Location:** `packages/core/src/session/compaction.ts`

When context is compacted, the summarization prompt explicitly requires structured output with verbatim values:

```
MODIFIED_FILES: list every file path that was touched (exact paths, no paraphrasing)
DECISIONS: architectural/design choices and their reasons
ERRORS: bugs found and fixes applied (include exact error text)
CURRENT_STATE: what works, what is broken, what is in progress
NEXT_STEPS: what still needs to be done
```

This prevents the common compaction failure mode where specific values (file paths, error codes, variable names) are paraphrased or lost.

---

## Memory extraction on compaction

**Location:** `packages/core/src/agent/loop.ts` + `packages/core/src/memory/extractor.ts`

Before any compaction fires, the current conversation is analyzed for facts worth remembering:
- User preferences and communication style
- Project-specific architectural decisions
- Recurring patterns in how the user works
- Key discoveries about the codebase

These are stored in SQLite and re-injected into the `## What I Remember` section of every future session's system prompt — without relying on conversation history.

# Session Compaction

When a conversation approaches the model's context limit, OmniCod automatically compacts it — replacing the accumulated history with a structured summary that preserves the essential information.

## When compaction triggers

Two independent conditions can trigger compaction:

| Condition | Default | Config key |
|-----------|---------|-----------|
| Token count approaches context limit | 80% of limit | automatic |
| Message count exceeds threshold | 100 messages | `compaction.messageCountThreshold` |

---

## Compaction strategies

Three strategies are available. Set via `/config set compaction.strategy <strategy>`.

### `micro` (automatic, fastest)

Used when the overflow is small (< 8% of context limit). No LLM call — heuristic-only.

- Removes messages with very low importance scores
- Uses `smartCompact` to stay within budget
- Falls through to `session` if still overflowing

### `snip` (for tool-heavy sessions)

Used when > 55% of context is tool output. Makes one LLM call to summarize tool operations.

**Output format:**
```
MODIFIED_FILES: exact paths of files read, written, or edited
COMMANDS_RUN: bash commands and outcomes (success/fail/error)
ERRORS_FIXED: bugs and resolutions (verbatim error messages)
CURRENT_STATE: one sentence on where the task stands
```

Conversation messages are preserved; only tool call/result pairs are summarized.

### `session` (default)

Full session compaction. Makes one LLM call to produce a structured summary.

**Output format:**
```
MODIFIED_FILES: exact file paths (verbatim — never paraphrased)
DECISIONS: architectural/design choices and reasons
ERRORS: bugs found and fixes applied (exact error text)
CURRENT_STATE: what works, what is broken, what is in progress
NEXT_STEPS: what still needs to be done
```

After summarization, files mentioned in the summary are re-injected with their current content (up to 3 files, 4 000 chars each).

---

## Strategy selection logic

```
overflow < 8% of context  →  try micro first, fall to session if needed
tool output > 55%          →  snip
otherwise                  →  session
```

The `strategy` config setting adjusts behavior within each path:

| Setting | Effect |
|---------|--------|
| `aggressive` | Shorter summaries, fewer tail turns preserved |
| `balanced` | Default behavior |
| `conservative` | Longer summaries, more tail turns preserved |

---

## Tail turns

The `tailTurns` setting controls how many recent conversation turns are preserved verbatim after compaction (not summarized):

```bash
omnicod /config set compaction.tailTurns 3
```

Default: 2. Conservative strategy adds 2 extra turns; aggressive subtracts 1.

---

## Circuit breaker

If compaction fails 3 times in a row (LLM call errors), the circuit breaker opens and compaction is skipped for 60 seconds. This prevents infinite retry loops on provider errors.

---

## Post-compact file re-injection

After `session` compaction, file paths mentioned in the summary are resolved and their current content is injected:

- Up to 3 files
- Up to 4 000 chars per file
- Files that don't exist on disk are skipped silently

This ensures the model immediately has the relevant source code in context after a compaction boundary.

---

## Memory extraction before compaction

Before compaction fires, `extractAndStoreMemories` is called on the current conversation. Facts worth remembering (user preferences, project decisions, key discoveries) are extracted and stored in SQLite.

These memories are re-injected into every future session's system prompt under `## What I Remember`, independent of the compacted context.

---

## Compaction boundary markers

Each compacted summary includes a UUID boundary marker:

```
[COMPACT:a3b2f1c8]
```

This makes compaction points traceable in session history and helps with debugging context issues.

---

## Manual compaction

Force a compaction at any time:

```
/compact
```

---

## Viewing context usage

The context bar in the status bar shows current usage:

```
ctx ████████░░ 156k / 200k
```

Color coding:
- Green: < 60% used
- Yellow: 60–85% used  
- Red: > 85% used (compaction imminent)

# Slash Commands

Full reference for all Aurict slash commands. Type `/help` inside the TUI to see this list.

---

## Session & Navigation

### `/help`
List all available commands.

### `/status`
Show terminal session health: context usage, active checkpoints, MCP connections, GateGuard rules, and runtime state.

### `/session`
Show current session info — ID, token count, message count, and provider/model. With no args shows current session; `/session restore <id>` restores a previous session.

### `/sessions` (alias: `/resume`)
Open an interactive picker to browse and restore previous sessions. Supports search: `/sessions search <query>`.
From a shell, `aurict --resume <id>` continues a saved session and `aurict --continue` picks the most recent one.

### `/new`
Start a new session. The conversation, token counters, and checkpoints reset; the previous session
stays in the database and in `/resume`.

### `/clear`
Clear the conversation history in the current session. Does not delete persisted session from the database.

### `/history`
Show recent visible messages and the persisted session tail from the database.

### `/cost`
Show session token usage and an estimated cost breakdown by provider pricing.

### `/rewind` and `/undo`
A checkpoint is saved before every prompt runs. `/rewind` lists earlier prompts (newest first);
choosing one returns the conversation to just before that prompt and puts the prompt back in the
composer. When the agent changed files since then, you choose between restoring those files too
or keeping them as they are. `/rewind N` goes N prompts back with the same choice. `/undo [N]`
restores files and conversation N prompts back without asking. `Esc Esc` on an empty composer
opens the same rewind flow for a chosen prompt. Only files changed by Aurict's file tools are
restored; edits you made to those files afterwards are overwritten.

### `/fork`
Fork the current session — creates an independent copy that continues from the same point. Useful for exploring alternative approaches without losing the original.

### `/branch`
Fork the conversation into a new branch or switch between existing branches. Branches share the same session ID but diverge from a checkpoint.

### `/exit`
Exit Aurict.

---

## Agent & Model

### `/models`
Open an interactive model picker for the current provider. After selecting a model, a second picker appears for effort level (when supported).

### `/providers`
Show all configured providers and their API key status.

### `/agent`
Switch the active session agent: `omni`, `plan`, `review`, or any custom agent defined in `.aurict/agents/`. 

```
/agent omni
/agent plan
```

### `/coordinator`
Toggle multi-agent coordinator mode. When enabled, the coordinator breaks tasks into subtasks and routes them to specialist worker agents.

### `/approvals` (alias: `/permissions`)
Choose how tool calls are approved. Without arguments it opens a picker; `/approvals ask|auto|full`
sets the mode directly. The active mode is shown in the footer when it is not `ask`.

| Mode | Behavior |
|---|---|
| `ask` | Every file change and command waits for approval |
| `auto` | Project Auto (see `/autopilot`): bounded file changes inside the project run; commands still ask |
| `full` | Everything runs without asking, except requests the gate rates as dangerous |

Changing the workdir resets the mode to `ask`.

### `/autopilot`
Toggle Project Auto for the current project (alias: `/auto`). Project Auto approves only bounded
`write`, `edit`, and `apply_patch` requests inside the active project. Shell commands, secrets,
`.git/.aurict`, paths outside the project, dangerous requests, and broad deletions still require
direct approval. Changing the active workdir disables the mode and opens a new Yes/No choice.

### `/agents`
List custom agents defined in `.aurict/agents/`. Shows name, type, and activation status.

### `/background` (alias: `/bg`)
Run, inspect, or cancel an independent worker-pool task. Background tasks use a separate session, so they never detach or race the active conversation.

```
/background run Inspect the repository and report the test failures
/background          # list background tasks
/background <id>     # inspect a task's current output
/background cancel <id>
```

---

## Code & Git

### `/review` (alias: `/rv`)
Preview and run a read-only, diff-scoped code review without changing Aurict's runtime or
terminal framework. The preview deterministically records every changed file and hunk before
the model runs. Findings must use structured JSON, reference only manifest files, and point to
a changed new-side line (or use a file-level location).

```
/review                         # preview staged, unstaged, and untracked changes
/review run                     # review the workspace
/review preview --base main     # preview changes since merge-base with main
/review run --commit abc123     # review one commit
/review list
/review show <id>
/review resume <id>
/review cancel [id]
```

Review sessions are atomically stored in `.aurict/reviews/`. A failed or interrupted review is
kept with its error. Resume rejects a stale snapshot if files changed after preview. Large reviews
are split deterministically at file boundaries, active reviews can be cancelled, and stalled workers
time out. Review workers receive only the existing read-only `read`, `glob`, `grep`, and `lsp` tools.

### `/commit`
AI-assisted git commit. Stages all changes, analyzes the diff, and generates a conventional commit message. Prompts for confirmation before committing.

### `/diff`
Open the working tree diff against `HEAD` — staged, unstaged, and untracked files — in the
full-screen diff viewer. Untracked files over 256 KB and beyond the first 50 are listed as skipped.

### `/diffs`
Show all `edit`, `write`, and `apply_patch` outputs from the current terminal session.

### `/worktree`
Manage git worktrees for parallel development. Lets you enter a branch in isolation without disturbing the main working tree.

```
/worktree list
/worktree enter <branch>
/worktree exit
```

### `/undo`
Roll back the last N agent steps — reverts both file edits and conversation messages. Defaults to 1 step.

```
/undo        # undo last step
/undo 3      # undo last 3 steps
```

### `/checkpoints`
List all saved checkpoints in the current session with their index, timestamp, and step description.

### `/replay`
Jump to any checkpoint by index (random access). Unlike `/undo` which is sequential, `/replay` can jump forward or backward.

```
/replay 4
```

### `/proof`
Show the current session's durable completion proof: changed files, verification evidence,
open work, and any explicit waivers. Export the raw record with `/proof json`. A required
criterion can only be waived with a reason:

```
/proof
/proof json
/proof waive verification test runner unavailable in this environment
```

Proof records are stored in `.aurict/proofs/` and completion remains gated while required
evidence is pending or failed.

### `/flight`
List failure recordings captured automatically when a tool fails. Each recording includes
redacted arguments, output, error, runtime details, and a workspace dependency fingerprint.

```
/flight
/flight show <id>
/flight replay <id>
/flight replay <id> --confirm
/flight replay <id> --confirm --allow-drift
```

Read-only failures can be replayed directly. Potentially mutating commands require
`--confirm`; destructive, stateful, or secret-bearing recordings are never replayed.
Workspace drift must be acknowledged explicitly. Records are stored in `.aurict/flights/`.

### `/rewind`
Rewind the conversation to a checkpoint, with an interactive picker if no index is provided.

```
/rewind      # interactive picker
/rewind 2    # jump to checkpoint 2
```

---

## Memory & Context

### `/memory`
Manage persistent memory entries that are injected into every session for this project.

```
/memory add <text>    # add a new memory
/memory list          # list all memories
/memory remove <id>   # remove by ID
```

### `/pin`
Manage pinned context — content that is always injected into the system prompt.

```
/pin <text>           # pin a note
/pin --global <text>  # pin globally (all projects)
/pin                  # list pinned items
/pin remove <id>      # remove by ID
```

### `/ctx`
Show context token breakdown: system prompt, conversation history, tool results, memory, and remaining budget.

### `/compact`
View or configure the context compaction strategy. Compaction summarizes old messages before the context window fills.

```
/compact              # show current strategy
/compact auto         # auto-compact at 80% threshold
/compact now          # compact immediately
```

### `/btw`
Add a side note to the current session without affecting the conversation flow or being treated as a user message.

### `/stash`
Save and restore draft input between sessions.

```
/stash save           # stash current input
/stash pop            # restore stashed input
/stash list           # list stashes
```

---

## Config & Setup

### `/init`
Initialize Aurict project files in the current directory. Creates `.aurict/config.json`, `AGENTS.md`, and starter skill files without overwriting existing files.

### `/config`
Get or set API keys and default provider/model.

```
/config set anthropic sk-ant-...          # set API key
/config set default.provider anthropic    # set default provider
/config set default.model claude-sonnet-4-6
/config get default.provider             # read a value
/config list                              # show all settings
```

### `/theme`
Open an interactive theme picker. Changes take effect immediately.

### `/settings`
Open the settings panel (same as `Ctrl+S`).

### `/keys`
Show all keybindings — built-in and any custom overrides.

### `/doctor`
Run full diagnostics: binary deps, provider connectivity, local server, sandbox, and MCP status. Also available as a standalone CLI subcommand: `aurict doctor`.

### `/version`
Print the installed Aurict version.

---

## Tools & Skills

### `/skills`
List all skills detected and activated for the current project, with their activation reasons.

### `/skill`
Manage skills by URL or local path.

```
/skill add https://...    # install from URL
/skill add ./my-skill     # install from local path
/skill remove <name>      # remove
/skill list               # list installed
```

### `/plugin`
Plugin marketplace: search, install, and remove plugins and skill packs.

```
/plugin search <query>    # search marketplace
/plugin add <name>        # install by name
/plugin add <url>         # install from URL
/plugin remove <name>     # uninstall
/plugin list              # list installed
```

### `/skill-scores`
Show per-project skill effectiveness scores and priority boosts based on usage history.

### `/mcp`
List all connected MCP servers and their tool counts.

### `/design`
Open the design agent wizard — enter a project brief, pick a design system (Material, Tailwind, Shadcn, etc.), and select a skill template.

---

## Utilities

### `/export`
Export the current session to Markdown or HTML.

```
/export md          # export as Markdown
/export html        # export as HTML
```

### `/share`
Export the session as HTML and optionally upload it to transfer.sh for sharing.

### `/watch`
Watch a file or directory and notify (or auto-run a prompt) when it changes.

```
/watch src/           # watch for changes (notify only)
/watch src/ "run tests on the changed file"  # auto-run prompt on change
```

### `/unwatch`
Stop watching a path. Omit the path to stop all active watchers.

### `/protect`
Add a file pattern to GateGuard protection. Aurict will ask for confirmation before writing to matching paths.

```
/protect src/auth/
/protect "**/*.env"
```

### `/unprotect`
Remove a custom GateGuard protection pattern.

### `/adr`
Manage architecture decision records stored in `.aurict/decisions/`.

```
/adr new "Use SQLite for session storage"
/adr list
/adr show <id>
```

### `/diag`
View and resolve project diagnostics — tool failure records stored in `.aurict/diagnostics/`.

### `/crashes`
View crash reports from previous sessions.

### `/editor`
Open `$EDITOR` to compose a longer message, then send it when you save and close the editor.

### `/template`
Save and reuse named message templates stored in `~/.aurict/templates/`.

```
/template save <name>     # save current input as template
/template use <name>      # load template into input
/template list            # list saved templates
```

### `/undercover`
Toggle undercover mode — strips AI identity markers from responses. Useful in public repos where commit messages and comments shouldn't mention AI.

---

## Companion

### `/pet`
Pet your companion for +10 XP.

### `/name`
Set your companion's name.

### `/companion`
Show companion status: species, name, level, XP, and unlocked hats.

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

### `/sessions`
Open an interactive picker to browse and restore previous sessions. Supports search: `/sessions search <query>`.

### `/clear`
Clear the conversation history in the current session. Does not delete persisted session from the database.

### `/history`
Show recent visible messages and the persisted session tail from the database.

### `/cost`
Show session token usage and an estimated cost breakdown by provider pricing.

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

### `/autopilot`
Toggle autopilot mode — auto-approves all permission prompts. Use with care; intended for trusted automated workflows.

### `/agents`
List custom agents defined in `.aurict/agents/`. Shows name, type, and activation status.

### `/background` (alias: `/bg`)
Move the current running task to the background, or list all background tasks.

```
/background          # move current task to background
/background          # (when idle) list background tasks
```

---

## Code & Git

### `/commit`
AI-assisted git commit. Stages all changes, analyzes the diff, and generates a conventional commit message. Prompts for confirmation before committing.

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

# Aurict

**A terminal-native AI coding assistant built for the way developers actually work.**

```
❯ aurict
```

Aurict runs entirely in your terminal. No browser tabs, no Electron overhead, no clipboard
juggling between windows. You stay in the environment where you already write code, and the AI
meets you there — with full access to your files, shell, language servers, and running processes.

---

## Why Aurict?

Most AI coding tools are built around a chat interface that happens to have a code block.
Aurict is built around a **coding environment** that happens to have a chat interface.

**It understands your project before you say a word.**
Aurict scans your repository on startup — framework, language, package manager, config files,
existing conventions — and injects that context into every request. You don't have to explain
that you're using Next.js with Tailwind and Drizzle. It already knows.

**It works with real tools, not simulated ones.**
Every file read, shell command, and code edit happens through a typed, permission-controlled
tool layer. Commands are classified as safe, warning, or dangerous before execution. Risky
execution is guarded by the policy sandbox: permission gates, protected paths, scrubbed env,
timeouts, output limits, and audit trails. This is not container isolation; Docker is optional
for heavier isolation. You always know what's happening and why.

**It thinks in parallel, not in sequence.**
Long tasks — refactoring a module, writing a test suite, auditing security — are broken into
subtasks and distributed across a pool of specialized worker agents: code, review, test, docs,
performance, security, debug, analytics, explore. Results flow back into a shared context.

**It speaks your stack's language.**
218+ skills cover specific frameworks, tools, and patterns. A skill isn't a prompt template —
it's a structured context injection that shapes how the AI reasons about your particular
combination of technologies.

**It stays out of your way.**
The TUI is built on Ink (React for terminals). It renders cleanly, scrolls correctly, handles
wide output, and gets out of the way when you're not interacting with it. No flickering, no
full-screen takeovers.

**It exposes a local API.**
Every session is reachable over HTTP with bearer-token auth. Pipe output from scripts, drive
Aurict from CI, or build your own tooling on top.

---

## Features

### Core Agent

| Feature | Description |
|---|---|
| **Multi-agent orchestration** | Worker thread isolation, 3+1 coordinator model (explore, code, review, specialist) |
| **218+ Skills** | Automatic project analysis, framework-specific context injection at startup |
| **Streaming responses** | Token-level streaming with live reasoning display for extended thinking models |
| **Session memory** | SQLite-backed persistent conversation history with full restore |
| **Context compaction** | Automatic summarization before context overflow, configurable thresholds |
| **Undo** | Roll back the last N agent steps including file edits |

### Tools

| Tool | Description |
|---|---|
| `bash` | Shell execution with conservative safe/warning/danger classification |
| `read` | File reading with line-range support |
| `write` | Atomic file writes |
| `edit` | Precise string-replace edits with diff preview |
| `glob` | Pattern-based file search with 30s timeout protection |
| `grep` | Regex search across files |
| `webfetch` | HTTP fetch with automatic HTML stripping |
| `websearch` | Web search integration |
| `lsp` | TypeScript/Python language server diagnostics before edits |
| `todo` | Project-local task tracking, persisted to `.aurict/todos.json` |
| `apply_patch` | Multi-file patch application with preview, GateGuard checks, and granular approval |
| `subagent` | Spawn a typed specialist agent inline |

### Security

| Feature | Description |
|---|---|
| **Bash classifier** | Three-tier analysis (safe / warning / danger) before any shell command runs |
| **Policy sandbox** | Risky executables run through command classification, approvals, protected paths, scrubbed env, timeouts, output limits, and audit logs; Docker is optional for heavier isolation |
| **Permission system** | Per-tool allow/deny rules, wildcard path matching, always-allow list |
| **JWT auth** | Bearer token on the local HTTP API, auto-generated at `~/.aurict/server-token` |

### Design Agent

| Feature | Description |
|---|---|
| **150+ Design systems** | Material, Shadcn, Radix, Tailwind, Chakra, Ant Design, and more |
| **111 Skill templates** | Component generation, layout, theming, accessibility, animation |
| **TUI wizard** | `/design` opens an interactive project brief → system → skill picker |
| **Brief analysis** | Fuzzy-matches your description to the most relevant design system |

### Integrations

| Feature | Description |
|---|---|
| **MCP client** | `claude_desktop_config.json`-compatible MCP server support |
| **30+ Language LSP** | TypeScript, JavaScript, Python, Go, Rust, Ruby, Java, Kotlin, Dart, C/C++, and more |
| **Ollama** | Local model support via Ollama API |
| **OpenRouter** | 200+ models through a single API key |

---

## LLM Robustness Layer

Aurict works well even with weaker or cheaper models because reliability logic lives in the framework — not in the model.

### Pattern-Completion Mitigation

LLMs sometimes fill in code from training memory rather than from what's actually in the file. Aurict fights this at three levels:

**A — Edit failure diagnosis**
When `edit` fails because `old_string` doesn't match, the error now explicitly tells the model it likely pattern-completed and must re-read the file before retrying. Weak models that guess content without reading are caught and redirected immediately.

**B — Re-read gating (10-call staleness window)**
Every file read or write is tracked with a call-index timestamp. When `edit` is called on a file that hasn't been read in the last 10 tool calls, the current file content is automatically injected into the result — without executing the edit. The model sees actual current content and can retry with a correct `old_string`.

**C — Symbol pre-verification**
Before a write or edit on a TypeScript/JavaScript file, named imports from local modules are extracted and verified. If the file exists but the named export doesn't, the write is blocked with a diagnostic message pointing to the missing symbol. Hallucinated function and type names are caught before they reach the filesystem.

### Additional Robustness Features

| Feature | What it does |
|---|---|
| **Dual-path TypeScript verification** | `tsc --noEmit` runs automatically after every edit/write on typed files. TypeScript errors in the edited file are appended to the tool result so the model can self-correct without a separate check step. Results cached 8 seconds. |
| **Stuck detection** | A per-turn failure tracker detects when the same tool+error combination appears twice in a row. A `[SYSTEM]` warning is injected into the next result, forcing the model to change approach. |
| **Error analysis hints** | Every tool error is inspected by regex. ENOENT, module-not-found, TypeScript errors, port-in-use, permission denied, OOM — each pattern generates a one-line actionable hint appended to the error. |
| **Output summarization** | Tool outputs over 4 000 chars are automatically summarized before reaching the model. `grep` results: first 50 matches + file/count summary. General output: head 2 500 chars + tail 600 chars with an omission notice. |
| **Proactive file injection** | File paths mentioned in the user's message are resolved and injected into the system prompt before the model even calls `read`. The model starts with the relevant content already in context. |
| **Git context freshness** | For Anthropic providers, git status/branch/log is placed in a separate uncached system message block so it reflects the current state on every turn — never stale from the 5-minute prompt cache. |
| **Structured compaction** | Session summaries are required to output MODIFIED_FILES, DECISIONS, ERRORS, CURRENT_STATE, and NEXT_STEPS with verbatim file paths and error messages. Vague summaries that lose specific values are structurally prevented. |
| **Memory extraction on compaction** | Before context is compacted, memories (preferences, project facts, patterns) are extracted and stored in SQLite. They are re-injected into every future session without relying on the conversation history. |

---

## Installation

### Compile from source (recommended)

Produces a single self-contained binary with the Bun runtime embedded — no runtime dependencies.

```bash
git clone https://github.com/aurict/aurict
cd aurict
bun install
bun run build

# Run
./dist/aurict
```

### Global install via npm

```bash
npm install -g @aurict/cli
aurict
```

### Requirements

- **Bun** 1.3+ (for building from source)
- **Node.js** 20+ (for the npm package)
- An API key for at least one supported provider

---

## Quick Start

```bash
# Set your API key
aurict /config set anthropic sk-ant-...

# Start the TUI
aurict

# Pipe mode — non-interactive single query
echo "What does this function do?" | aurict

# Open a specific directory
aurict --workdir ~/projects/myapp
```

### CLI Flags

```
aurict [options]

  -p, --provider <id>    Provider to use (anthropic, openai, openrouter, google, ollama)
  -m, --model <id>       Model to use
  -s, --system <text>    System prompt override
  -w, --workdir <path>   Working directory (default: current directory)
      --undercover        Hide AI identity in responses
  -v, --version          Print version
  -h, --help             Show help
```

---

## Providers

| Provider | Environment Variable | Notes |
|---|---|---|
| **Anthropic** | `ANTHROPIC_API_KEY` | Claude 3.5, Claude 4 (Sonnet, Opus, Haiku) |
| **OpenAI** | `OPENAI_API_KEY` | GPT-4o, o3, o4-mini |
| **Google** | `GOOGLE_GENERATIVE_AI_KEY` | Gemini 2.0, 2.5 Flash/Pro |
| **OpenRouter** | `OPENROUTER_API_KEY` | 200+ models via single endpoint |
| **Ollama** | `OLLAMA_BASE_URL` | Local models, default: `localhost:11434` |

---

## Slash Commands

| Command | Description |
|---|---|
| `/help` | List all available commands |
| `/models` | Open interactive model picker |
| `/providers` | Show configured providers |
| `/design` | Open the design agent wizard |
| `/session` | Show current session info (ID, tokens, message count) |
| `/sessions` | Browse and restore previous sessions |
| `/clear` | Clear the current conversation |
| `/memory` | Manage persistent memory entries |
| `/ctx` | Analyze current context token usage |
| `/compact` | Configure or trigger context compaction |
| `/undo` | Roll back the last N agent steps |
| `/export` | Export session as Markdown or HTML |
| `/config` | Get or set API keys and defaults |
| `/keys` | Show all keyboard shortcuts |
| `/btw` | Add a background note to the current session |
| `/skills` | List detected skills for the current project |
| `/agents` | Show active and recent subagents |

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Enter` | Send message |
| `Shift+Enter` | Insert newline |
| `Ctrl+←` / `Ctrl+→` | Move cursor word by word |
| `Ctrl+A` / `Ctrl+E` | Jump to start / end of line |
| `Ctrl+C` | Cancel current operation or exit |
| `Ctrl+T` | Toggle floating task panel |
| `Ctrl+S` | Open settings panel |
| `Ctrl+X` | Toggle subagent view |
| `Ctrl+O` | Expand collapsed tool output |
| `Esc` | Close overlay / go back |

---

## MCP Integration

Aurict reads MCP server configuration from `.aurict/mcp.json`, using the same format
as `claude_desktop_config.json`.

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<your-token>"
      }
    }
  }
}
```

MCP tools appear alongside built-in tools and are subject to the same permission system.

---

## HTTP API

Aurict exposes a REST/SSE API on `127.0.0.1:7777`. All endpoints except `/v1/health`
require bearer-token authentication.

```bash
# Read the auto-generated token
TOKEN=$(cat ~/.aurict/server-token)

# Health check (no auth required)
curl http://localhost:7777/v1/health

# Create a session
curl -X POST http://localhost:7777/v1/session \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider":"anthropic","model":"claude-sonnet-4-6"}'

# List sessions
curl http://localhost:7777/v1/session \
  -H "Authorization: Bearer $TOKEN"

# Send a message (SSE stream)
curl -N http://localhost:7777/v1/session/<id>/message \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"refactor the auth module"}'
```

The token is stored at `~/.aurict/server-token` (mode 600) and regenerated if deleted.

---

## Configuration

Aurict stores all configuration in `~/.aurict/`:

```
~/.aurict/
├── aurict.db          # SQLite database (sessions, config, MCP servers)
├── server-token        # HTTP API bearer token (chmod 600)
└── todos.json          # Project-local task list (per working directory)
```

To set a default provider and model:

```bash
aurict /config set default.provider anthropic
aurict /config set default.model claude-sonnet-4-6
```

---

## Development

```bash
bun install              # install dependencies
bun run dev              # start in development mode (hot reload)
bun run test             # run the test suite
bun run typecheck        # TypeScript strict check (both packages)
bun run build            # compile to standalone binary → dist/aurict
```

### Project Structure

```
aurict/
├── packages/
│   ├── core/            # Agent engine, tools, providers, storage, server
│   │   ├── src/
│   │   │   ├── agent/       # Agent loop, compaction, protocol
│   │   │   ├── tool/        # Tool registry, built-ins, classifier, sandbox
│   │   │   ├── provider/    # Anthropic, OpenAI, Google, OpenRouter, Ollama
│   │   │   ├── server/      # Hono HTTP API, auth middleware
│   │   │   ├── storage/     # SQLite, Drizzle ORM, schema
│   │   │   └── design/      # Design systems, skill templates, matcher
│   │   └── test/            # 92 unit tests
│   └── cli/             # Ink TUI, commands, keybindings
│       ├── src/
│       │   ├── tui/         # React components (Ink)
│       │   ├── commands/    # Slash command registry
│       │   └── utils/       # Theme, highlight, token display
│       └── test/            # 39 TUI component tests
├── scripts/
│   └── build.ts         # bun build --compile → dist/aurict
└── dist/
    └── aurict          # Compiled binary (~103 MB, Bun runtime embedded)
```

### Running Tests

```bash
# All tests
bun run test

# Core only
bun test packages/core/test/*.test.ts

# TUI only
bun test packages/cli/test/*.test.tsx

# Single file
bun test packages/core/test/classifier.test.ts
```

Test coverage includes: bash classifier, token counting, permission system, context compaction,
sandbox detection, agent pool, HTTP server auth, and TUI components (Spinner, Markdown,
StatusBar, StartupBanner).

---

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting Started](docs/getting-started.md) | Installation, first run, basic usage |
| [Configuration](docs/configuration.md) | Config file, env vars, CLAUDE.md, GateGuard |
| [Tools Reference](docs/tools.md) | All built-in tools, parameters, permissions |
| [Providers](docs/providers.md) | Anthropic, OpenAI, OpenRouter, Google, Ollama, and more |
| [Skills & Project Detection](docs/skills.md) | Automatic context injection, custom skills |
| [Multi-Agent Mode](docs/multi-agent.md) | Coordinator, worker types, agent pool |
| [LLM Robustness Layer](docs/llm-robustness.md) | Pattern-completion mitigation, re-read gating, symbol verification |
| [Session Compaction](docs/compaction.md) | Strategies, structured summaries, memory extraction |
| [MCP Servers](docs/mcp.md) | Model Context Protocol integration |
| [HTTP API](docs/api.md) | REST endpoints, SSE streaming, scripting |
| [Hook System](docs/hooks.md) | Lifecycle hooks, blocking tools |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Bun 1.3+ |
| Language | TypeScript 5.8+ strict mode |
| TUI | Ink 5 (React for terminals) |
| AI SDK | Vercel AI SDK 4.x |
| Database | SQLite via `bun:sqlite` + Drizzle ORM |
| HTTP server | Hono 4 |
| Token counting | js-tiktoken (model-specific BPE encodings) |
| MCP | @modelcontextprotocol/sdk |
| Testing | Bun test runner + ink-testing-library |

---

## License

MIT

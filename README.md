# Aurict

**A terminal-native AI coding assistant built for the way developers actually work.**

**[aurict.dev](https://aurict.dev)** · [npm](https://www.npmjs.com/package/aurict) · [Docs](https://aurict.dev/docs) · [Changelog](https://aurict.dev/changelog)

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
execution is constrained by a low-overhead policy sandbox: permission gates, protected paths,
timeouts, output limits, and audit trails. You always know what's happening and why.

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
| `bash` | Shell execution with AST-level safe/warning/danger classification |
| `read` | File reading with line-range support |
| `write` | Atomic file writes |
| `edit` | Precise string-replace edits with diff preview |
| `glob` | Pattern-based file search with 30s timeout protection |
| `grep` | Regex search across files |
| `webfetch` | HTTP fetch with automatic HTML stripping |
| `websearch` | Web search integration |
| `lsp` | TypeScript/Python language server diagnostics before edits |
| `todo` | Project-local task tracking, persisted to `.aurict/todos.json` |
| `apply_patch` | Unified diff patch application |
| `subagent` | Spawn a typed specialist agent inline |

### Security

| Feature | Description |
|---|---|
| **Bash classifier** | Three-tier analysis (safe / warning / danger) before any shell command runs |
| **Policy sandbox** | Low-overhead guarded execution: command classification, approvals, protected paths, timeouts, output limits, and audit logs |
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
bun run test             # run all 131 tests
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

MIT — see [aurict.dev](https://aurict.dev) for full documentation and community.

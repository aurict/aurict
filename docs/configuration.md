# Configuration

## Config file location

Aurict stores all configuration in `~/.aurict/aurict.db` (SQLite). Human-readable config is managed through slash commands or environment variables.

```
~/.aurict/
├── aurict.db          # SQLite: sessions, config, MCP servers, memories, todos
├── server-token        # HTTP API bearer token (chmod 600, auto-generated)
└── skills/             # Custom skill .md files (global)
```

Per-project config lives in:

```
<workdir>/
├── .aurict/
│   ├── CLAUDE.md       # Project instructions (injected into every session)
│   └── skills/         # Project-local custom skills
├── CLAUDE.md           # Alternative project instructions location
└── AGENTS.md           # Alternative project instructions location
```

---

## Slash command config

```bash
# Set default provider and model
aurict /config set default.provider anthropic
aurict /config set default.model claude-sonnet-4-6

# View current config
aurict /config

# Set compaction strategy
aurict /config set compaction.strategy balanced   # aggressive | balanced | conservative

# Set context tail turns (turns preserved verbatim during compaction)
aurict /config set compaction.tailTurns 2
```

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic Claude API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini API key |
| `XAI_API_KEY` | xAI Grok API key |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API key |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint URL |
| `AWS_ACCESS_KEY_ID` | AWS Bedrock access key |
| `AWS_SECRET_ACCESS_KEY` | AWS Bedrock secret key |
| `AWS_REGION` | AWS region for Bedrock |
| `OLLAMA_BASE_URL` | Ollama server URL (default: `http://localhost:11434`) |
| `AURICT_SANDBOX_BACKEND` | Sandbox backend: `policy` (default), `docker`, or `none` |
| `AURICT_SANDBOX` | Backwards-compatible sandbox backend override |

---

## Project instructions (CLAUDE.md / AGENTS.md)

Any of these files are read and prepended to the system prompt at the start of every session:

| Path | Priority |
|------|----------|
| `~/.claude/CLAUDE.md` | Global (lowest) |
| `<workdir>/CLAUDE.md` | Project |
| `<workdir>/AGENTS.md` | Project (alternative) |
| `<workdir>/.claude/CLAUDE.md` | Project scoped (highest) |

**Limit:** 8 000 characters. Content beyond that is truncated with a notice.

Example `CLAUDE.md`:

```markdown
# Project conventions

- Use `bun` not `npm` or `yarn`
- All new files must have a JSDoc comment at the top
- Database queries go in `src/db/queries.ts`
- Never edit `src/generated/` — it's auto-generated
```

---

## Compaction settings

| Setting | Default | Description |
|---------|---------|-------------|
| `strategy` | `balanced` | `aggressive` (short), `balanced`, `conservative` (verbose) |
| `tailTurns` | `2` | How many recent turns to keep verbatim during compaction |
| `messageCountThreshold` | `100` | Compact when conversation exceeds this many messages |
| `contextLimit` | model default | Override context window (tokens) |

---

## GateGuard — protected paths

Protect sensitive files from accidental writes:

```bash
# Block all writes to secrets
aurict /gate add deny "**/.env*"
aurict /gate add deny "**/secrets/**"

# Require confirmation before writing to production config
aurict /gate add ask "**/prod.config.*"

# View current rules
aurict /gate list
```

---

## Sandbox model

Aurict uses a low-overhead policy sandbox by default. This is not a Docker container.
It is a guarded execution layer around shell work:

- command classification before execution (`safe`, `warning`, `danger`)
- explicit approval for mutating or dangerous commands
- protected path checks through GateGuard
- scrubbed environment for policy-sandboxed processes
- per-tool timeout and output truncation
- audit and diagnostics records for tool failures

Heavy process isolation backends such as Docker are intentionally not the default because they
increase startup time and resource usage. They can be added as an optional backend later without
changing the default policy-sandbox behavior.

Backend selection:

```bash
AURICT_SANDBOX_BACKEND=policy aurict   # default guarded execution
AURICT_SANDBOX_BACKEND=docker aurict   # optional heavier isolation
AURICT_SANDBOX_BACKEND=none aurict     # disable sandbox backend
```

---

## HTTP API port

The local HTTP server starts on `localhost:7777` by default.

You can override this in config:

```json
{
  "server": {
    "port": 5000,
    "disabled": false
  }
}
```

# Configuration

## Config file location

OmniCod stores all configuration in `~/.omnicod/omnicod.db` (SQLite). Human-readable config is managed through slash commands or environment variables.

```
~/.omnicod/
├── omnicod.db          # SQLite: sessions, config, MCP servers, memories, todos
├── server-token        # HTTP API bearer token (chmod 600, auto-generated)
└── skills/             # Custom skill .md files (global)
```

Per-project config lives in:

```
<workdir>/
├── .omnicod/
│   ├── CLAUDE.md       # Project instructions (injected into every session)
│   └── skills/         # Project-local custom skills
├── CLAUDE.md           # Alternative project instructions location
└── AGENTS.md           # Alternative project instructions location
```

---

## Slash command config

```bash
# Set default provider and model
omnicod /config set default.provider anthropic
omnicod /config set default.model claude-sonnet-4-6

# View current config
omnicod /config

# Set compaction strategy
omnicod /config set compaction.strategy balanced   # aggressive | balanced | conservative

# Set context tail turns (turns preserved verbatim during compaction)
omnicod /config set compaction.tailTurns 2
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
omnicod /gate add deny "**/.env*"
omnicod /gate add deny "**/secrets/**"

# Require confirmation before writing to production config
omnicod /gate add ask "**/prod.config.*"

# View current rules
omnicod /gate list
```

---

## HTTP API port

The local HTTP server starts on `localhost:4111` by default.

```bash
# Override port
omnicod --port 5000

# Disable HTTP server
omnicod --no-server
```

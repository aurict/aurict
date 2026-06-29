# Configuration

## Config file location

Aurict stores human-editable global config in `~/.aurict/config.json`. Runtime data such as sessions and memories may use `~/.aurict/aurict.db`.

```
~/.aurict/
├── config.json        # global provider/default/security config
├── aurict.db          # SQLite runtime data
├── server-token        # HTTP API bearer token (chmod 600, auto-generated)
└── skills/             # Custom skill .md files (global)
```

Per-project config lives in:

```
<workdir>/
├── .aurict/
│   ├── config.json     # project overrides for defaults/agents/security
│   ├── CLAUDE.md       # Project instructions (injected into every session)
│   └── skills/         # Project-local custom skills
├── CLAUDE.md           # Alternative project instructions location
└── AGENTS.md           # Alternative project instructions location
```

---

## Slash command config

```bash
# Set API keys
aurict /config set anthropic sk-ant-...

# Set default provider and model
aurict /config default provider anthropic
aurict /config default model claude-sonnet-4-6

# View current config
aurict /config

# Manage optional security capability
aurict /config security status
aurict /config security off
aurict /config security passive
aurict /config security active-lite
aurict /config security kali-full
aurict /config security allow example.com
aurict /config security image ghcr.io/aurict/aurict-security-lite:latest
aurict /config security pull
aurict /config security rate 60
aurict /config security concurrency 1

# Set compaction strategy
aurict /compact strategy balanced   # aggressive | balanced | conservative

# Manage long-task runtime guardrails
aurict /config longtask status
aurict /config longtask shadow
aurict /config longtask soft
aurict /config longtask strict
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

## Optional security sandbox

Active security tooling is disabled by default. When disabled, active pentest
skills, security scan tools, and security/pentest worker agent types are hidden
from the model/tool schema.

Enable the controlled security profile only for explicitly authorized targets:

```bash
aurict /config security active-lite
aurict /config security allow example.com
aurict /doctor
```

Equivalent config:

```json
{
  "securitySandbox": {
    "enabled": true,
    "profile": "active-lite",
    "image": "ghcr.io/aurict/aurict-security-lite:latest",
    "network": "restricted",
    "targetAllowlist": ["example.com", "*.example.test"],
    "requireApprovalFor": ["network-scan", "external-target"],
    "maxConcurrent": 1,
    "requestsPerMinute": 60
  }
}
```

Install the optional lite image from GHCR after explicitly enabling the profile:

```bash
docker pull ghcr.io/aurict/aurict-security-lite:latest
aurict /config security pull
```

Or build the optional lite image locally:

```bash
docker build -t aurict-security-lite:local docker/security-lite
aurict /config security image aurict-security-lite:local
```

Install or build the optional larger Kali-based profile manually when needed:

```bash
docker pull ghcr.io/aurict/aurict-kali-full:latest
docker build -t aurict-kali-full:local docker/security-kali-full
aurict /config security image aurict-kali-full:local
```

The lite image includes controlled diagnostic/scanning tools such as `curl`,
`jq`, `openssl`, `dig`, `whois`, `nmap`, `nikto`, `testssl.sh`, `sqlmap`,
`nuclei`, `ffuf`, and `gobuster`. It intentionally excludes brute-force,
password-cracking, MITM, and broad exploitation frameworks such as `metasploit`,
`aircrack-ng`, `bettercap`, `responder`, `hydra`, `medusa`, `john`, and
`hashcat`.

Container-backed scan types are exposed through fixed command builders, not raw
shell access:

| `security_scan.scan_type` | Tool |
|---------------------------|------|
| `web_baseline` | Built-in HTTP header baseline, no Docker required |
| `nmap_top` | `nmap --top-ports 100` |
| `nmap_service` | `nmap -sV -sC` |
| `testssl` | `testssl.sh` TLS assessment |
| `nikto` | web server misconfiguration scan |
| `nuclei` | template-based checks |
| `ffuf` | bounded web fuzzing |
| `gobuster` | bounded directory enumeration |
| `sqlmap` | low-risk SQLi validation (`--level 1 --risk 1 --batch --smart`) |

Profiles:

| Profile | Model visibility | Default image | Default limits |
|---------|------------------|---------------|----------------|
| `off` | Security tools/active skills hidden | none | none |
| `passive` | Defensive security review/reporting only | none | none |
| `active-lite` | Controlled active scans for allowlisted targets | `ghcr.io/aurict/aurict-security-lite:latest` | 1 concurrent, 60/min |
| `kali-full` | Larger experimental Kali-backed profile | `ghcr.io/aurict/aurict-kali-full:latest` | 1 concurrent, 30/min |

Aurict runs Docker-backed scans with restrictive Docker flags: `--cap-drop=ALL`,
`--security-opt=no-new-privileges`, `--read-only`, resource limits, a read-only
workspace mount, and a scoped `.aurict/security/runs/<run-id>/` output mount.
The runner enforces target allowlists, per-target rate limits, and profile
concurrency limits before starting Docker.

---

## Long-task runtime

Aurict includes core loop guardrails for long coding tasks. The runtime tracks a
bounded task ledger, changed files, verification state, recovery state, and
continuation budget. It helps prevent the model from stopping mid-task when
files changed but verification is still pending.

Modes:

| Mode | Behavior |
|------|----------|
| `off` | Disable long-task runtime guardrails |
| `shadow` | Record decisions and traces without auto-continuing |
| `soft` | Default; continue through the existing completion gate when clear work remains |
| `strict` | Reserved for stricter finalization policies as confidence increases |

Example:

```json
{
  "longTaskRuntime": {
    "enabled": true,
    "mode": "soft",
    "strictVerification": true,
    "maxContinuationSteps": 12,
    "maxRecoveryAttempts": 3,
    "maxVerificationRuns": 4,
    "maxNoProgressTurns": 3
  }
}
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

# Getting Started

## Installation

### From source (recommended — single binary, no runtime dependencies)

```bash
git clone https://github.com/aurict/aurict
cd aurict
bun install
bun run build
./dist/aurict
```

The binary embeds the Bun runtime (~103 MB). Copy it anywhere on your `$PATH`:

```bash
cp dist/aurict /usr/local/bin/aurict
```

### npm (global install)

```bash
npm install -g aurict
aurict
```

### Requirements

| Method | Requirement |
|--------|------------|
| Build from source | Bun 1.3+ |
| npm package | Node.js 20+ |
| Both | API key for at least one provider |

---

## First run

```
aurict
```

Aurict opens a full-terminal TUI. On first launch it will prompt for an API key if none is configured.

```
aurict /config set default.provider anthropic
aurict /config set default.model claude-sonnet-4-6
```

You can also set the key via environment variable:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
aurict
```

---

## Basic usage

| Action | How |
|--------|-----|
| Send a message | Type and press **Enter** |
| New line in input | **Shift+Enter** or **Ctrl+Enter** |
| Delete word | **Ctrl+Backspace** or **Ctrl+W** |
| Abort running agent | **Ctrl+C** |
| Exit | **Esc** |
| Slash commands | Type `/` to open the command picker |
| Task panel | **Ctrl+T** |
| Scroll output | **↑ / ↓** or mouse wheel |
| Undo last action | `/undo` |

---

## Starting in a specific directory

```bash
aurict --workdir /path/to/project
# or just cd first
cd /path/to/project && aurict
```

Aurict auto-detects the project type and injects relevant skills into the system prompt.

---

## Providers

Aurict supports 9 providers out of the box. Set your preferred one:

```bash
aurict /config set default.provider anthropic   # Anthropic Claude
aurict /config set default.provider openai      # OpenAI GPT
aurict /config set default.provider openrouter  # 200+ models
aurict /config set default.provider google      # Gemini
aurict /config set default.provider ollama      # Local models
```

See [providers.md](providers.md) for the full list and model IDs.

---

## Next steps

- [Configuration reference](configuration.md)
- [Tools reference](tools.md)
- [Skills and project detection](skills.md)
- [Multi-agent mode](multi-agent.md)
- [LLM robustness features](llm-robustness.md)

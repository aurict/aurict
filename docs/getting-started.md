# Getting Started

## Installation

### From source (recommended — single binary, no runtime dependencies)

```bash
git clone https://github.com/omnicod/omnicod
cd omnicod
bun install
bun run build
./dist/omnicod
```

The binary embeds the Bun runtime (~103 MB). Copy it anywhere on your `$PATH`:

```bash
cp dist/omnicod /usr/local/bin/omnicod
```

### npm (global install)

```bash
npm install -g omnicod
omnicod
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
omnicod
```

OmniCod opens a full-terminal TUI. On first launch it will prompt for an API key if none is configured.

```
omnicod /config set default.provider anthropic
omnicod /config set default.model claude-sonnet-4-6
```

You can also set the key via environment variable:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
omnicod
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
omnicod --workdir /path/to/project
# or just cd first
cd /path/to/project && omnicod
```

OmniCod auto-detects the project type and injects relevant skills into the system prompt.

---

## Providers

OmniCod supports 9 providers out of the box. Set your preferred one:

```bash
omnicod /config set default.provider anthropic   # Anthropic Claude
omnicod /config set default.provider openai      # OpenAI GPT
omnicod /config set default.provider openrouter  # 200+ models
omnicod /config set default.provider google      # Gemini
omnicod /config set default.provider ollama      # Local models
```

See [providers.md](providers.md) for the full list and model IDs.

---

## Next steps

- [Configuration reference](configuration.md)
- [Tools reference](tools.md)
- [Skills and project detection](skills.md)
- [Multi-agent mode](multi-agent.md)
- [LLM robustness features](llm-robustness.md)

# Providers

Aurict supports 9 LLM providers. Set your default:

```bash
aurict /config set default.provider <name>
aurict /config set default.model <model-id>
```

Or switch mid-session with `/model`.

---

## Anthropic

**Provider ID:** `anthropic`  
**Env var:** `ANTHROPIC_API_KEY`

| Model ID | Context | Notes |
|----------|---------|-------|
| `claude-opus-4-8` | 200k | Most capable, extended thinking |
| `claude-sonnet-4-6` | 200k | Recommended default — speed/quality balance |
| `claude-haiku-4-5-20251001` | 200k | Fastest, lowest cost |

**Prompt caching:** Git context and proactive file injections are placed in separate uncached system message blocks so they stay fresh every turn.

**Extended thinking:** Select effort level through the `/models` picker after choosing a model.

---

## OpenAI

**Provider ID:** `openai`  
**Env var:** `OPENAI_API_KEY`

| Model ID | Context | Notes |
|----------|---------|-------|
| `gpt-4o` | 128k | Latest GPT-4o |
| `gpt-4o-mini` | 128k | Fast, low cost |
| `o1` | 128k | Reasoning model |
| `o3-mini` | 128k | Fast reasoning |

---

## OpenRouter

**Provider ID:** `openrouter`  
**Env var:** `OPENROUTER_API_KEY`

Provides access to 200+ models through a single API key. Use any model ID from [openrouter.ai/models](https://openrouter.ai/models):

```bash
aurict /config set default.provider openrouter
aurict /config set default.model meta-llama/llama-3.3-70b-instruct
```

---

## Google

**Provider ID:** `google`  
**Env var:** `GOOGLE_GENERATIVE_AI_API_KEY`

| Model ID | Context | Notes |
|----------|---------|-------|
| `gemini-2.0-flash-exp` | 1M | Experimental, large context |
| `gemini-1.5-pro` | 2M | Largest context window |
| `gemini-1.5-flash` | 1M | Fast |

---

## Ollama (local)

**Provider ID:** `ollama`  
**Env var:** `OLLAMA_BASE_URL` (default: `http://localhost:11434`)

Run any Ollama model locally:

```bash
ollama pull llama3.2
aurict /config set default.provider ollama
aurict /config set default.model llama3.2
```

List available local models: `ollama list`

**Note:** Tool support varies by model. Models that don't support function calling run in text-only mode.

---

## xAI

**Provider ID:** `xai`  
**Env var:** `XAI_API_KEY`

| Model ID | Notes |
|----------|-------|
| `grok-2-latest` | Latest Grok 2 |
| `grok-beta` | Beta channel |

---

## Azure OpenAI

**Provider ID:** `azure`  
**Env vars:** `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`

```bash
aurict /config set default.provider azure
aurict /config set default.model gpt-4o  # your deployment name
```

---

## AWS Bedrock

**Provider ID:** `bedrock`  
**Env vars:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`

Supports Claude, Llama, and Titan models through AWS Bedrock.

---

## OpenCode (Zen)

**Provider ID:** `opencode`  
**Env var:** `OPENCODE_API_KEY`

---

## Switching models at runtime

```
/model                    # opens interactive model picker
/model claude-opus-4-8    # switch directly
```

The model picker shows all configured providers and lists available models with context window sizes.

---

## Effort / extended thinking

Extended thinking is supported on Anthropic models with reasoning capability. Set the effort level through the `/models` interactive picker — after selecting a model, a second picker appears for effort level (low / med / high / max).

The current effort level is shown in the status bar.

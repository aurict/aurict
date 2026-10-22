import { ProviderRegistry, createOpenAICompatiblePlugin, loadConfig, removeCustomProvider, setApiKey, setCustomProvider } from "@aurict/core"
import type { CommandDef, CommandResult, PickerItem } from "./types.js"
import { mergeModelLists } from "./command-helpers.js"

export const modelCommands: CommandDef[] = [
  // ── /models ───────────────────────────────────────────────────────────────
  {
    name:        "models",
    aliases:     ["m", "model"],
    description: "List and select models for the current provider",
    handler: async (_args, ctx): Promise<CommandResult> => {
      const plugin = ProviderRegistry.get(ctx.provider)
      let models = plugin.listModels()
      if (plugin.listModelsRemote) {
        try {
          models = mergeModelLists(models, await plugin.listModelsRemote())
        } catch (error) {
          ctx.addSystemMsg(`Remote model list unavailable; showing built-in models. ${error instanceof Error ? error.message : String(error)}`)
        }
      }
      const items: PickerItem[] = models.map((m) => ({
        id:    m.id,
        label: m.name,
        hint:  [
          `${Math.round(m.contextWindow / 1000)}K ctx`,
          m.supportsTools    ? "tools"    : null,
          m.supportsThinking ? "thinking" : null,
        ].filter(Boolean).join(" · "),
      }))
      return {
        type:  "picker",
        title: `Select model  [${ctx.provider}]`,
        items,
        onSelect: (item) => {
          ctx.setModel(item.id)
          const modelInfo   = models.find((m) => m.id === item.id)
          const hasThinking = modelInfo?.supportsThinking
            ?? (item.id.includes("claude") && !item.id.includes("haiku"))

          // Built-in thinking models (DeepSeek-R1, QwQ): effort can't be configured
          // buildThinkingOptions returning null = we don't send an effort value
          const plugin      = ProviderRegistry.get(ctx.provider)
          const isBuiltIn   = hasThinking && plugin.buildThinkingOptions(item.id, 4000) === null

          if (isBuiltIn) {
            // Thinking is automatic — don't show the effort picker, just inform
            ctx.setEffort(undefined)
            return
          }

          ctx.showPicker(
            hasThinking
              ? `Effort Level — ${item.label}`
              : `Effort Level — ${item.label}  (may not be supported)`,
            [
              { id: "0",     label: "Off",    hint: "No thinking (standard mode)" },
              { id: "4000",  label: "Low",    hint: "Light thinking · ~4K tokens" },
              { id: "10000", label: "Medium", hint: "Balanced thinking · ~10K tokens" },
              { id: "20000", label: "High",   hint: "Deep thinking · ~20K tokens" },
              { id: "32000", label: "Max",    hint: "Maximum thinking · 32K tokens" },
            ],
            (effortItem) => {
              const val = parseInt(effortItem.id)
              ctx.setEffort(val > 0 ? val : undefined)
            }
          )
        },
      }
    },
  },


  // ── /providers ────────────────────────────────────────────────────────────
  {
    name:        "providers",
    aliases:     ["ps", "provider"],
    description: "Select provider and configure API key",
    handler: (_args, ctx): CommandResult => {
      const all = ProviderRegistry.available()
      const customIds = new Set(Object.keys(loadConfig(ctx.workdir).customProviders ?? {}))

      const items: PickerItem[] = [
        ...all.map((p) => ({
          id:    p.id,
          label: p.name,
          hint:  [
            p.id === ctx.provider ? "● active" : null,
            p.hasKey ? "✓ key set" : "✗ no key",
          ].filter(Boolean).join("  "),
        })),
        { id: "__custom__", label: "+ Add custom provider", hint: "OpenAI-compatible endpoint" },
      ]

      const switchToProvider = (id: string) => {
        const plugin       = ProviderRegistry.get(id)
        const defaultModel = plugin.defaultModel()
        ctx.setProvider(id, defaultModel)

        // Then open the model picker
        ctx.showPicker(
          `Select model  [${id}]`,
          plugin.listModels().map((m) => ({
            id:   m.id,
            label: m.name,
            hint: `${Math.round(m.contextWindow / 1000)}K ctx`,
          })),
          (item) => ctx.setModel(item.id),
        )
      }

      const promptForNewKey = (providerId: string, providerName: string) => {
        const KEY_LABELS: Record<string, string> = {
          anthropic:  "Anthropic API Key (sk-ant-...)",
          openai:     "OpenAI API Key (sk-...)",
          openrouter: "OpenRouter API Key (sk-or-...)",
          google:     "Google AI API Key",
          opencode:   "OpenCode API Key",
          xai:        "xAI API Key (xai-...)",
          azure:      "Azure OpenAI API Key  (set AZURE_OPENAI_ENDPOINT separately)",
          bedrock:    "AWS Access Key ID  (set AWS_SECRET_ACCESS_KEY + AWS_REGION separately)",
          nvidia:     "NVIDIA NIM API Key (nvapi-...)",
          zai:        "Z.AI API Key",
          alibaba:    "Alibaba/DashScope API Key",
        }
        ctx.showPrompt(
          KEY_LABELS[providerId] ?? `${providerName} API Key`,
          "Paste your API key here",
          true,
          (key) => {
            setApiKey(providerId, key)
            switchToProvider(providerId)
          },
        )
      }

      const addCustomProvider = () => {
        ctx.showPrompt("Custom provider name", "e.g. My Local Endpoint", false, (name) => {
          ctx.showPrompt("Base URL", "e.g. https://api.example.com/v1", false, (baseUrl) => {
            ctx.showPrompt("Default model ID", "e.g. my-model-name", false, (defaultModel) => {
              ctx.showPrompt("API Key", "Paste your API key here", true, (apiKey) => {
                const id = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `custom-${Date.now()}`
                const def = { name: name.trim(), baseUrl: baseUrl.trim(), apiKey, defaultModel: defaultModel.trim() }
                setCustomProvider(id, def)
                ProviderRegistry.register(createOpenAICompatiblePlugin({
                  id,
                  name:         def.name,
                  baseURL:      def.baseUrl,
                  getApiKey:    () => def.apiKey,
                  defaultModel: def.defaultModel,
                  models:       [{ id: def.defaultModel, name: def.defaultModel, contextWindow: 128_000, maxOutput: 8_000, supportsTools: true, supportsVision: false }],
                  modelsEndpoint: `${def.baseUrl.replace(/\/+$/, "")}/models`,
                }))
                switchToProvider(id)
              })
            })
          })
        })
      }

      return {
        type:  "picker",
        title: "Select Provider",
        items,
        onSelect: (item) => {
          if (item.id === "__custom__") {
            addCustomProvider()
            return
          }

          const provider = all.find((p) => p.id === item.id)!

          // Ollama doesn't require a key — go straight through
          if (item.id === "ollama") {
            switchToProvider(item.id)
            return
          }

          // Is there a key already?
          if (provider.hasKey) {
            const isCustom = customIds.has(item.id)
            // Key exists — use the existing key, reset it, or (custom providers) remove it
            ctx.showPicker(
              `${provider.name} — API key already configured`,
              [
                { id: "use", label: "Use existing key", hint: "Continue with current key" },
                isCustom
                  ? { id: "remove", label: "Remove this custom provider", hint: "Delete from config" }
                  : { id: "reset", label: "Reset API key", hint: "Enter a new API key" },
              ],
              (choice) => {
                if (choice.id === "use") {
                  switchToProvider(item.id)
                } else if (choice.id === "remove") {
                  removeCustomProvider(item.id)
                  ProviderRegistry.unregister(item.id)
                  ctx.addSystemMsg(`Removed custom provider "${provider.name}".`)
                } else {
                  promptForNewKey(item.id, provider.name)
                }
              },
            )
          } else {
            // No key — ask for one first
            ctx.showPicker(
              `${provider.name} — No API key configured`,
              [
                { id: "enter", label: "Enter API key now",   hint: "Save to ~/.aurict/config.json" },
                { id: "skip",  label: "Skip (set env var manually)", hint: `export ${item.id.toUpperCase()}_API_KEY=...` },
              ],
              (choice) => {
                if (choice.id === "skip") return
                promptForNewKey(item.id, provider.name)
              },
            )
          }
        },
      }
    },
  },
]

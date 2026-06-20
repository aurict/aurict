import React, { useState, useCallback } from "react"
import { Box, Text, useInput } from "ink"
import { ProviderRegistry, setApiKey, setDefault } from "@aurict/core"
import { useTheme } from "../utils/theme.js"

interface Props {
  onComplete: (provider: string, model: string) => void
}

type Step = "provider" | "apikey" | "model"

const PROVIDER_ENV_MAP: Record<string, string> = {
  anthropic:  "ANTHROPIC_API_KEY",
  openai:     "OPENAI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  google:     "GOOGLE_GENERATIVE_AI_API_KEY",
  xai:        "XAI_API_KEY",
  opencode:   "OPENCODE_API_KEY",
  azure:      "AZURE_OPENAI_API_KEY",
  bedrock:    "AWS_ACCESS_KEY_ID",
}

export function SetupWizard({ onComplete }: Props) {
  const theme     = useTheme()
  const providers = ProviderRegistry.available()

  const [step,     setStep]     = useState<Step>("provider")
  const [cursor,   setCursor]   = useState(0)
  const [provider, setProvider] = useState<string>("")
  const [apiKey,   setApiKeyVal] = useState("")
  const [modelCur, setModelCur] = useState(0)
  const [error,    setError]    = useState<string | null>(null)

  const models = provider ? ProviderRegistry.get(provider).listModels() : []

  const finishSetup = useCallback((prov: string, mod: string) => {
    setDefault("provider", prov)
    setDefault("model", mod)
    onComplete(prov, mod)
  }, [onComplete])

  useInput((input, key) => {
    setError(null)

    if (step === "provider") {
      if (key.upArrow)   setCursor(c => Math.max(0, c - 1))
      if (key.downArrow) setCursor(c => Math.min(providers.length - 1, c + 1))
      if (key.return) {
        const chosen = providers[cursor]!
        setProvider(chosen.id)
        if (chosen.id === "ollama" || chosen.hasKey) {
          // No key needed — go straight to model picker
          const mods = ProviderRegistry.get(chosen.id).listModels()
          if (mods.length === 0) { finishSetup(chosen.id, ProviderRegistry.get(chosen.id).defaultModel()); return }
          setModelCur(0)
          setStep("model")
        } else {
          setApiKeyVal("")
          setStep("apikey")
        }
      }
    }

    if (step === "apikey") {
      if (key.escape) { setStep("provider"); setApiKeyVal(""); return }
      if (key.return) {
        if (!apiKey.trim()) { setError("API key cannot be empty"); return }
        setApiKey(provider, apiKey.trim())
        const envVar = PROVIDER_ENV_MAP[provider]
        if (envVar) process.env[envVar] = apiKey.trim()
        const mods = ProviderRegistry.get(provider).listModels()
        if (mods.length === 0) { finishSetup(provider, ProviderRegistry.get(provider).defaultModel()); return }
        setModelCur(0)
        setStep("model")
        return
      }
      if (key.backspace || key.delete) {
        setApiKeyVal(v => v.slice(0, -1))
        return
      }
      if (input && !key.ctrl && !key.meta) {
        setApiKeyVal(v => v + input)
      }
    }

    if (step === "model") {
      if (key.upArrow)   setModelCur(c => Math.max(0, c - 1))
      if (key.downArrow) setModelCur(c => Math.min(models.length - 1, c + 1))
      if (key.escape) { setStep("apikey"); return }
      if (key.return) {
        const chosen = models[modelCur]!
        finishSetup(provider, chosen.id)
      }
    }
  })

  const prov = providers[cursor]

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      {/* Header */}
      <Box marginBottom={1} flexDirection="column">
        <Text color={theme.accent} bold>◈ Aurict — First Run Setup</Text>
        <Text color={theme.textDim}>Configure a provider to get started</Text>
      </Box>

      {/* Step 1: Provider */}
      {step === "provider" && (
        <Box flexDirection="column">
          <Text color={theme.textSecondary} bold>Step 1 of 3 — Choose a Provider</Text>
          <Box marginTop={1} flexDirection="column">
            {providers.map((p, i) => {
              const active = i === cursor
              return (
                <Box key={p.id} marginY={0}>
                  <Text color={active ? theme.accent : theme.textDim}>
                    {active ? "▶ " : "  "}
                  </Text>
                  <Text color={active ? theme.textPrimary : theme.textSecondary} bold={active}>
                    {p.name.padEnd(18)}
                  </Text>
                  {p.hasKey
                    ? <Text color={theme.success}> ✓ key set</Text>
                    : p.id === "ollama"
                      ? <Text color={theme.textDim}> no key needed</Text>
                      : <Text color={theme.textDim}> requires API key</Text>
                  }
                </Box>
              )
            })}
          </Box>
          <Box marginTop={1}>
            <Text color={theme.textDim}>↑↓ navigate  ↵ select</Text>
          </Box>
        </Box>
      )}

      {/* Step 2: API Key */}
      {step === "apikey" && (
        <Box flexDirection="column">
          <Text color={theme.textSecondary} bold>
            Step 2 of 3 — API Key for {providers.find(p => p.id === provider)?.name}
          </Text>
          <Box marginTop={1} flexDirection="column">
            <Text color={theme.textDim}>
              Enter your API key (characters are hidden):
            </Text>
            <Box marginTop={1}>
              <Text color={theme.borderBright}>{"> "}</Text>
              <Text color={theme.textPrimary}>{"●".repeat(Math.min(apiKey.length, 32))}</Text>
              <Text color={theme.accent}>▌</Text>
            </Box>
            {apiKey.length > 0 && (
              <Text color={theme.textDim}>({apiKey.length} chars)</Text>
            )}
          </Box>
          {error && <Text color={theme.error}>{error}</Text>}
          <Box marginTop={1}>
            <Text color={theme.textDim}>↵ confirm  Esc back</Text>
          </Box>
        </Box>
      )}

      {/* Step 3: Model */}
      {step === "model" && (
        <Box flexDirection="column">
          <Text color={theme.textSecondary} bold>
            Step 3 of 3 — Choose a Model
          </Text>
          <Box marginTop={1} flexDirection="column">
            {models.slice(0, 10).map((m, i) => {
              const active = i === modelCur
              const ctx    = Math.round(m.contextWindow / 1000)
              return (
                <Box key={m.id} marginY={0}>
                  <Text color={active ? theme.accent : theme.textDim}>
                    {active ? "▶ " : "  "}
                  </Text>
                  <Text color={active ? theme.textPrimary : theme.textSecondary} bold={active}>
                    {m.name.padEnd(26)}
                  </Text>
                  <Text color={theme.textDim}>
                    {ctx}K ctx
                    {m.supportsThinking ? "  thinking" : ""}
                  </Text>
                </Box>
              )
            })}
            {models.length > 10 && (
              <Text color={theme.textDim}>  …+{models.length - 10} more (change later with /models)</Text>
            )}
          </Box>
          <Box marginTop={1}>
            <Text color={theme.textDim}>↑↓ navigate  ↵ select  Esc back</Text>
          </Box>
        </Box>
      )}
    </Box>
  )
}

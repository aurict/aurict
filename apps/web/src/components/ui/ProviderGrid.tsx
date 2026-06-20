"use client"
import { m } from "framer-motion"

interface Provider {
  name: string
  models: string[]
  color: string
  icon: string
}

const PROVIDERS: Provider[] = [
  {
    name: "Anthropic",
    models: ["Claude 4 Opus", "Sonnet", "Haiku"],
    color: "#D97706",
    icon: "◈",
  },
  {
    name: "OpenAI",
    models: ["GPT-4o", "o1", "o3", "o4-mini"],
    color: "#10A37F",
    icon: "◉",
  },
  {
    name: "Google",
    models: ["Gemini 2.0", "1.5 Pro", "Flash"],
    color: "#4285F4",
    icon: "◆",
  },
  {
    name: "OpenRouter",
    models: ["200+ models", "One API key"],
    color: "#6366F1",
    icon: "◇",
  },
  {
    name: "xAI",
    models: ["Grok 3", "Grok 2"],
    color: "#1D9BF0",
    icon: "✕",
  },
  {
    name: "Azure",
    models: ["Azure OpenAI", "Enterprise"],
    color: "#0078D4",
    icon: "▲",
  },
  {
    name: "AWS Bedrock",
    models: ["Claude via AWS", "Titan"],
    color: "#FF9900",
    icon: "☁",
  },
  {
    name: "Ollama",
    models: ["Local models", "No API key"],
    color: "#ffffff",
    icon: "🦙",
  },
  {
    name: "OpenCode",
    models: ["OpenCode", "Zenmux"],
    color: "#8B5CF6",
    icon: "◎",
  },
]

export function ProviderGrid() {
  return (
    <section
      style={{
        padding: "80px 24px",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <m.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 12,
            color: "var(--accent)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Providers
        </m.p>
        <m.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          style={{
            fontSize: "clamp(24px, 4vw, 36px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "var(--text)",
          }}
        >
          9 providers.{" "}
          <span className="gradient-text">Switch anytime.</span>
        </m.h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        {PROVIDERS.map((provider, i) => (
          <m.div
            key={provider.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            style={{
              padding: "20px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              transition: "all 0.2s",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = provider.color + "60"
              e.currentTarget.style.transform = "translateY(-2px)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)"
              e.currentTarget.style.transform = "translateY(0)"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  color: provider.color,
                }}
              >
                {provider.icon}
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--text)",
                }}
              >
                {provider.name}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 4,
              }}
            >
              {provider.models.map((model) => (
                <span
                  key={model}
                  style={{
                    fontSize: 11,
                    fontFamily: "var(--font-geist-mono)",
                    color: "var(--text-muted)",
                    background: "var(--bg-subtle)",
                    borderRadius: 4,
                    padding: "2px 6px",
                  }}
                >
                  {model}
                </span>
              ))}
            </div>
          </m.div>
        ))}
      </div>

      <p
        style={{
          textAlign: "center",
          fontSize: 13,
          color: "var(--text-muted)",
          marginTop: 24,
        }}
      >
        Bring your own API key — no vendor lock-in
      </p>
    </section>
  )
}

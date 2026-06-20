"use client"
import { m } from "framer-motion"

interface Integration {
  name: string
  description: string
  icon: string
  color: string
}

const INTEGRATIONS: Integration[] = [
  { name: "GitHub", description: "Repository integration", icon: "🐙", color: "#f0f6fc" },
  { name: "PostgreSQL", description: "Database queries", icon: "🐘", color: "#336791" },
  { name: "Docker", description: "Container management", icon: "🐳", color: "#2496ED" },
  { name: "Slack", description: "Team notifications", icon: "💬", color: "#4A154B" },
  { name: "Jira", description: "Issue tracking", icon: "📋", color: "#0052CC" },
  { name: "Linear", description: "Project management", icon: "📐", color: "#5E6AD2" },
  { name: "Figma", description: "Design integration", icon: "🎨", color: "#F24E1E" },
  { name: "Sentry", description: "Error tracking", icon: "🔍", color: "#362D59" },
  { name: "Vercel", description: "Deployment", icon: "▲", color: "#ffffff" },
  { name: "AWS", description: "Cloud services", icon: "☁️", color: "#FF9900" },
  { name: "Notion", description: "Documentation", icon: "📝", color: "#ffffff" },
  { name: "Browser", description: "Web automation", icon: "🌐", color: "#4285F4" },
]

export function IntegrationGrid() {
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
          Integrations
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
          Works with your{" "}
          <span className="gradient-text">existing tools.</span>
        </m.h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 12,
        }}
      >
        {INTEGRATIONS.map((integration, i) => (
          <m.div
            key={integration.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04 }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "20px 12px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              transition: "all 0.2s",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--border-bright)"
              e.currentTarget.style.transform = "translateY(-2px)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)"
              e.currentTarget.style.transform = "translateY(0)"
            }}
          >
            <span style={{ fontSize: 28 }}>{integration.icon}</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text)",
                textAlign: "center",
              }}
            >
              {integration.name}
            </span>
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
        Via MCP (Model Context Protocol) — connect any tool with a config file
      </p>
    </section>
  )
}

import { Nav } from "@/components/Nav"
import { Footer } from "@/components/sections/Footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Changelog — OmniCod",
  description: "OmniCod release history and changelog.",
}

const CHANGELOG = [
  {
    version: "1.0.0",
    date: "2026-06-07",
    tag: "Initial release",
    tagColor: "#4eba65",
    changes: [
      { type: "new", text: "Multi-agent orchestration — 9 specialist agents (Explore, Code, Review, Test, Docs, Security, Debug, Performance, Analytics)" },
      { type: "new", text: "218+ contextual skills auto-injected based on project framework and language" },
      { type: "new", text: "Bash classifier — safe commands run instantly, dangerous ones require confirmation" },
      { type: "new", text: "Sandbox execution — risky processes run in Docker isolation" },
      { type: "new", text: "MCP client — reads claude_desktop_config.json, all existing servers work instantly" },
      { type: "new", text: "Design agent wizard — 150+ design systems, 111 skill templates" },
      { type: "new", text: "Custom tool loader — drop .js ESM files in .omnicod/tools/" },
      { type: "new", text: "Custom skill loader — drop .md files in .omnicod/skills/" },
      { type: "new", text: "Model persistence — selected provider/model saved across restarts" },
      { type: "new", text: "Platform binaries for macOS arm64/x64, Linux x64/arm64" },
      { type: "new", text: "Published to npm as `omnicod` and `@omnicod/cli`" },
    ],
  },
]

const TYPE_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  new:  { label: "New",  color: "#4eba65", bg: "rgba(78,186,101,0.1)" },
  fix:  { label: "Fix",  color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  break: { label: "Breaking", color: "#ff6b6b", bg: "rgba(255,107,107,0.1)" },
  perf: { label: "Perf", color: "#818cf8", bg: "rgba(129,140,248,0.1)" },
}

export default function ChangelogPage() {
  return (
    <>
      <Nav />
      <main style={{ maxWidth: 740, margin: "0 auto", padding: "100px 24px 80px" }}>
        <div style={{ marginBottom: 60 }}>
          <p
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: 12,
              color: "var(--accent)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Changelog
          </p>
          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--text)",
            }}
          >
            Release history
          </h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
          {CHANGELOG.map((release) => (
            <div key={release.version} style={{ position: "relative" }}>
              {/* version header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  marginBottom: 28,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: 20,
                    fontWeight: 700,
                    color: "var(--text)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  v{release.version}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "var(--font-geist-mono)",
                    color: release.tagColor,
                    background: `${release.tagColor}18`,
                    border: `1px solid ${release.tagColor}40`,
                    borderRadius: 4,
                    padding: "3px 9px",
                  }}
                >
                  {release.tag}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-geist-mono)",
                    marginLeft: "auto",
                  }}
                >
                  {release.date}
                </span>
              </div>

              {/* changes */}
              <div
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                {release.changes.map((change, i) => {
                  const style = TYPE_STYLE[change.type] ?? TYPE_STYLE.new
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 14,
                        padding: "14px 20px",
                        borderBottom: i < release.changes.length - 1 ? "1px solid var(--border)" : "none",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: "var(--font-geist-mono)",
                          color: style.color,
                          background: style.bg,
                          borderRadius: 4,
                          padding: "2px 7px",
                          marginTop: 1,
                          flexShrink: 0,
                          letterSpacing: "0.04em",
                        }}
                      >
                        {style.label}
                      </span>
                      <p style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.6 }}>
                        {change.text}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}

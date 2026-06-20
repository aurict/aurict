import { Nav } from "@/components/Nav"
import { Footer } from "@/components/sections/Footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title:       "Changelog — Release History",
  description: "Aurict version history and release notes. Latest: v1.0.6 — setup wizard, /cost cache breakdown, UI polish, and QuickSearch recency.",
  alternates:  { canonical: "https://aurict.dev/changelog" },
  openGraph: {
    title:       "Aurict Changelog — Release History",
    description: "Version history and release notes for Aurict, the open-source terminal AI coding assistant.",
    url:         "https://aurict.dev/changelog",
  },
}

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type":    "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home",      "item": "https://aurict.dev" },
    { "@type": "ListItem", "position": 2, "name": "Changelog", "item": "https://aurict.dev/changelog" },
  ],
}

const CHANGELOG = [
  {
    version: "1.0.5",
    date: "2026-06-09",
    tag: "Polish & reliability",
    tagColor: "#818cf8",
    changes: [
      { type: "new",  text: "/cost command — full cache token breakdown with savings estimate; cache-aware pricing for all 9 providers" },
      { type: "new",  text: "First-run setup wizard — 3-step interactive onboarding (provider → API key → model) on first launch" },
      { type: "new",  text: "/help now groups all 51 commands into 6 categories (Setup, Session, Agents, Context, Tools, Info)" },
      { type: "new",  text: "QuickSearch recency tie-break — equal fuzzy score results sorted by last updated" },
      { type: "new",  text: "Auto-update check — notifies when a newer version is on npm (24h cache, non-blocking)" },
    ],
  },
  {
    version: "1.0.4",
    date: "2026-06-08",
    tag: "Token counting",
    tagColor: "#a78bfa",
    changes: [
      { type: "new",  text: "Full token breakdown — cache reads, cache writes, and reasoning tokens now tracked separately (was only input/output)" },
      { type: "new",  text: "Rate limit retry — automatic 2-attempt backoff; reads Retry-After header with 15s default" },
      { type: "new",  text: "Provider error parsing — maps raw HTTP errors to actionable messages (invalid key, rate limit, network, unavailable)" },
      { type: "fix",  text: "Context window usage now correctly counts cached tokens (input + cacheRead + cacheWrite)" },
    ],
  },
  {
    version: "1.0.3",
    date: "2026-06-08",
    tag: "UI polish",
    tagColor: "#06b6d4",
    changes: [
      { type: "new",  text: "Spinner, Message, StreamingView, StartupBanner now use theme accent colors — all 20 themes apply correctly" },
      { type: "new",  text: "Streaming errors shown inline in chat instead of crashing — actionable error box with retry hint" },
      { type: "new",  text: "Paste truncation notification — system message shows original vs. trimmed character count" },
      { type: "new",  text: "Draft save indicator — StatusBar shows ✓ saved for 3s after auto-save" },
      { type: "new",  text: "CommandSuggest +N more — shows hidden match count and 'type to narrow' hint" },
      { type: "new",  text: "TaskFloatingPanel scroll — ↑↓ navigation with N above / N below overflow hints" },
      { type: "fix",  text: "StatusBar wide mode hint text cleanup" },
    ],
  },
  {
    version: "1.0.1",
    date: "2026-06-07",
    tag: "Bug fixes",
    tagColor: "#f59e0b",
    changes: [
      { type: "fix",  text: "StatusBar token type — Props interface updated to accept full TokenBreakdown" },
      { type: "fix",  text: "loop.ts compaction early-return was returning incomplete token object (missing cacheRead/cacheWrite/reasoning)" },
      { type: "fix",  text: "CommandContext.tokens type widened to include optional cache fields" },
    ],
  },
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
      { type: "new", text: "Custom tool loader — drop .js ESM files in .aurict/tools/" },
      { type: "new", text: "Custom skill loader — drop .md files in .aurict/skills/" },
      { type: "new", text: "Model persistence — selected provider/model saved across restarts" },
      { type: "new", text: "Platform binaries for macOS arm64/x64, Linux x64/arm64" },
      { type: "new", text: "Published to npm as `aurict` and `@aurict/cli`" },
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
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

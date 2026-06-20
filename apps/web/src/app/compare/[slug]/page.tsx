import { Nav } from "@/components/Nav"
import { Footer } from "@/components/sections/Footer"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

interface Comparison {
  slug: string
  competitor: string
  title: string
  description: string
  tagline: string
  ourStrengths: string[]
  theirStrengths: string[]
  features: { name: string; aurict: boolean; competitor: boolean }[]
}

const COMPARISONS: Comparison[] = [
  {
    slug: "claude-code",
    competitor: "Claude Code",
    title: "Aurict vs Claude Code",
    description: "Claude Code is tied to Anthropic only. Aurict supports 9 providers, ships with 9 specialist agents, 218+ auto-injected skills, and runs as a native binary.",
    tagline: "Provider flexibility meets multi-agent power",
    ourStrengths: [
      "9 AI providers — switch anytime, no vendor lock-in",
      "9 specialist agents running in parallel",
      "218+ contextual skills auto-injected",
      "Native binary — no Node.js runtime required",
      "Works on macOS, Linux, and Windows",
      "Bash classifier for command safety",
      "MCP client — use your existing config",
    ],
    theirStrengths: [
      "Tight Anthropic integration",
      "Official Claude tool",
    ],
    features: [
      { name: "Multiple AI providers", aurict: true, competitor: false },
      { name: "Multi-agent architecture", aurict: true, competitor: false },
      { name: "Auto-injected skills", aurict: true, competitor: false },
      { name: "Native compiled binary", aurict: true, competitor: false },
      { name: "Windows support", aurict: true, competitor: false },
      { name: "Bash command classifier", aurict: true, competitor: false },
      { name: "MCP integration", aurict: true, competitor: true },
      { name: "Open source (MIT)", aurict: true, competitor: true },
      { name: "Persistent memory", aurict: true, competitor: true },
    ],
  },
  {
    slug: "cursor",
    competitor: "Cursor",
    title: "Aurict vs Cursor",
    description: "Cursor is an IDE. Aurict is a terminal AI. Different approaches, different strengths. Choose based on your workflow.",
    tagline: "Terminal-native vs IDE-bound",
    ourStrengths: [
      "Works in any terminal — no IDE required",
      "Lightweight — native binary, not an Electron app",
      "Multi-agent orchestration",
      "9 providers, switch anytime",
      "218+ contextual skills",
      "SSH-friendly — works on remote servers",
    ],
    theirStrengths: [
      "Visual IDE experience",
      "Inline code suggestions",
      "Visual diff viewer",
    ],
    features: [
      { name: "Terminal-native", aurict: true, competitor: false },
      { name: "IDE-based", aurict: false, competitor: true },
      { name: "Multiple AI providers", aurict: true, competitor: true },
      { name: "Multi-agent architecture", aurict: true, competitor: false },
      { name: "Works over SSH", aurict: true, competitor: false },
      { name: "Lightweight binary", aurict: true, competitor: false },
      { name: "Inline suggestions", aurict: false, competitor: true },
      { name: "Open source", aurict: true, competitor: false },
    ],
  },
  {
    slug: "aider",
    competitor: "Aider",
    title: "Aurict vs Aider",
    description: "Aider is a single-agent Git-focused tool. Aurict uses 9 specialist agents with multi-provider support and 218+ skills.",
    tagline: "Multi-agent vs single-agent",
    ourStrengths: [
      "9 specialist agents for different tasks",
      "9 AI providers — not tied to one",
      "218+ contextual skills",
      "Bash classifier for safety",
      "Sandbox execution in Docker",
      "Design agent wizard",
      "Windows native binary",
    ],
    theirStrengths: [
      "Git integration focus",
      "Simple single-agent approach",
    ],
    features: [
      { name: "Multi-agent architecture", aurict: true, competitor: false },
      { name: "Multiple AI providers", aurict: true, competitor: true },
      { name: "Auto-injected skills", aurict: true, competitor: false },
      { name: "Bash command classifier", aurict: true, competitor: false },
      { name: "Sandbox execution", aurict: true, competitor: false },
      { name: "Git-focused workflow", aurict: false, competitor: true },
      { name: "Windows support", aurict: true, competitor: false },
      { name: "Open source", aurict: true, competitor: true },
    ],
  },
  {
    slug: "github-copilot",
    competitor: "GitHub Copilot",
    title: "Aurict vs GitHub Copilot",
    description: "GitHub Copilot is an autocomplete tool. Aurict is a full AI coding assistant with multi-agent orchestration and deep codebase understanding.",
    tagline: "Full assistant vs autocomplete",
    ourStrengths: [
      "Full coding assistant, not just autocomplete",
      "9 specialist agents",
      "9 AI providers",
      "218+ contextual skills",
      "Codebase-aware context",
      "Custom tools and skills",
      "MCP integration",
      "No subscription required",
    ],
    theirStrengths: [
      "Inline IDE suggestions",
      "GitHub ecosystem integration",
    ],
    features: [
      { name: "Full coding assistant", aurict: true, competitor: false },
      { name: "Multi-agent architecture", aurict: true, competitor: false },
      { name: "Multiple AI providers", aurict: true, competitor: false },
      { name: "No subscription fee", aurict: true, competitor: false },
      { name: "Terminal-native", aurict: true, competitor: false },
      { name: "Inline IDE suggestions", aurict: false, competitor: true },
      { name: "GitHub integration", aurict: false, competitor: true },
      { name: "Open source", aurict: true, competitor: false },
    ],
  },
  {
    slug: "opencode",
    competitor: "OpenCode",
    title: "Aurict vs OpenCode",
    description: "Both are open-source terminal AI tools. Aurict has multi-agent architecture, 9 providers, and 218+ skills. OpenCode is simpler but more limited.",
    tagline: "Feature-rich vs minimal",
    ourStrengths: [
      "9 specialist agents",
      "9 AI providers vs limited providers",
      "218+ contextual skills",
      "Bash classifier for safety",
      "Sandbox execution",
      "Windows native binary",
      "Design agent wizard",
    ],
    theirStrengths: [
      "Simpler, minimal approach",
      "Smaller codebase",
    ],
    features: [
      { name: "Multi-agent architecture", aurict: true, competitor: false },
      { name: "9 AI providers", aurict: true, competitor: false },
      { name: "218+ skills", aurict: true, competitor: false },
      { name: "Bash classifier", aurict: true, competitor: false },
      { name: "Sandbox execution", aurict: true, competitor: false },
      { name: "Windows support", aurict: true, competitor: false },
      { name: "Open source", aurict: true, competitor: true },
      { name: "Terminal-native", aurict: true, competitor: true },
    ],
  },
]

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const comp = COMPARISONS.find((c) => c.slug === slug)
  if (!comp) return {}

  return {
    title: comp.title,
    description: comp.description,
    alternates: { canonical: `https://aurict.dev/compare/${slug}` },
    openGraph: {
      title: comp.title,
      description: comp.description,
      url: `https://aurict.dev/compare/${slug}`,
    },
  }
}

export default async function ComparePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const comp = COMPARISONS.find((c) => c.slug === slug)

  if (!comp) notFound()

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": comp.title,
    "description": comp.description,
    "url": `https://aurict.dev/compare/${slug}`,
    "author": { "@type": "Organization", "name": "Aurict" },
  }

  const otherComparisons = COMPARISONS.filter((c) => c.slug !== slug)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <Nav />
      <main style={{ maxWidth: 820, margin: "0 auto", padding: "100px 24px 80px" }}>
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: `vs ${comp.competitor}`, href: `/compare/${slug}` },
          ]}
        />

        {/* Hero */}
        <div style={{ marginBottom: 56 }}>
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
            Comparison
          </p>
          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--text)",
              marginBottom: 16,
            }}
          >
            Aurict vs {comp.competitor}
          </h1>
          <p style={{ fontSize: 16, color: "var(--text-dim)", lineHeight: 1.7, maxWidth: 600 }}>
            {comp.description}
          </p>
          <p
            style={{
              fontSize: 14,
              fontFamily: "var(--font-geist-mono)",
              color: "var(--accent)",
              marginTop: 16,
            }}
          >
            {comp.tagline}
          </p>
        </div>

        {/* Feature Comparison Table */}
        <section style={{ marginBottom: 56 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 24,
              letterSpacing: "-0.02em",
            }}
          >
            Feature Comparison
          </h2>
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 100px 100px",
                padding: "12px 20px",
                background: "var(--bg-subtle)",
                borderBottom: "1px solid var(--border)",
                fontSize: 12,
                fontFamily: "var(--font-geist-mono)",
                color: "var(--text-muted)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              <span>Feature</span>
              <span style={{ textAlign: "center", color: "var(--accent)" }}>Aurict</span>
              <span style={{ textAlign: "center" }}>{comp.competitor}</span>
            </div>
            {/* Rows */}
            {comp.features.map((feature, i) => (
              <div
                key={feature.name}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 100px 100px",
                  padding: "14px 20px",
                  borderBottom: i < comp.features.length - 1 ? "1px solid var(--border)" : "none",
                  fontSize: 14,
                  alignItems: "center",
                }}
              >
                <span style={{ color: "var(--text-dim)" }}>{feature.name}</span>
                <span style={{ textAlign: "center", fontSize: 16 }}>
                  {feature.aurict ? (
                    <span style={{ color: "var(--success)" }}>✓</span>
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>—</span>
                  )}
                </span>
                <span style={{ textAlign: "center", fontSize: 16 }}>
                  {feature.competitor ? (
                    <span style={{ color: "var(--success)" }}>✓</span>
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>—</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Our Strengths */}
        <section style={{ marginBottom: 56 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 24,
              letterSpacing: "-0.02em",
            }}
          >
            Why Choose Aurict
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {comp.ourStrengths.map((strength) => (
              <div
                key={strength}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "12px 16px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              >
                <span style={{ color: "var(--success)", fontSize: 16, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.5 }}>{strength}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section
          style={{
            textAlign: "center",
            padding: "48px 32px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            marginBottom: 56,
          }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>
            Ready to try Aurict?
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-dim)", marginBottom: 24 }}>
            Install in seconds. Open source. No subscription required.
          </p>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              fontFamily: "var(--font-geist-mono)",
              fontSize: 14,
              color: "var(--text)",
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "12px 20px",
            }}
          >
            <span style={{ color: "var(--accent)" }}>$</span>
            <span>npm install -g aurict</span>
          </div>
        </section>

        {/* Other Comparisons */}
        <section>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 16,
            }}
          >
            Other Comparisons
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {otherComparisons.map((c) => (
              <Link
                key={c.slug}
                href={`/compare/${c.slug}`}
                style={{
                  fontSize: 13,
                  color: "var(--text-dim)",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "6px 12px",
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-bright)"
                  e.currentTarget.style.color = "var(--text)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)"
                  e.currentTarget.style.color = "var(--text-dim)"
                }}
              >
                Aurict vs {c.competitor}
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

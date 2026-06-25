import type { Metadata } from "next"
import { Nav } from "@/components/Nav"
import { Footer } from "@/components/sections/Footer"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { CompareCard } from "@/components/ui/CompareCard"

export const metadata: Metadata = {
  title: "Aurict vs. Alternatives — Terminal AI Coding Assistant Comparisons",
  description: "See how Aurict compares to Claude Code, Cursor, Aider, GitHub Copilot, and OpenCode. Multi-provider, multi-agent, native binary.",
  alternates: { canonical: "https://aurict.com/compare" },
}

const COMPARISONS = [
  {
    slug: "claude-code",
    competitor: "Claude Code",
    tagline: "Provider flexibility meets multi-agent power",
    description: "Claude Code is Anthropic-only. Aurict supports 9 providers, 9 specialist agents, and runs as a native binary with no Node.js required.",
    differentiator: "Multi-provider + multi-agent",
  },
  {
    slug: "cursor",
    competitor: "Cursor",
    tagline: "Terminal-native vs IDE-bound",
    description: "Cursor is an Electron IDE. Aurict is a lightweight terminal tool — same AI capabilities, no context switching, no 200MB download.",
    differentiator: "Lightweight, no IDE required",
  },
  {
    slug: "aider",
    competitor: "Aider",
    tagline: "Full TUI vs command-line interface",
    description: "Aider is a CLI tool. Aurict adds a full interactive TUI, 9 specialist agents, 218+ contextual skills, and a plugin system on top.",
    differentiator: "Interactive TUI + agent orchestration",
  },
  {
    slug: "github-copilot",
    competitor: "GitHub Copilot",
    tagline: "Agentic tasks vs inline completions",
    description: "Copilot completes code inline. Aurict handles full tasks — refactoring, audits, test suites — with specialist agents running in parallel.",
    differentiator: "Full agentic tasks, not just completions",
  },
  {
    slug: "opencode",
    competitor: "OpenCode",
    tagline: "Deeper context, richer TUI",
    description: "Both are open-source terminal AI tools. Aurict adds 218+ auto-injected skills, 9 agent types, design wizard, and a plugin marketplace.",
    differentiator: "Skills system + design agent + plugins",
  },
]

export default function ComparePage() {
  return (
    <>
      <Nav />
      <main style={{ minHeight: "100vh", padding: "120px 24px 80px", maxWidth: 900, margin: "0 auto" }}>
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Compare", href: "/compare" }]} />

        <div style={{ marginBottom: 56, marginTop: 32 }}>
          <p
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: 12,
              color: "var(--accent)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            Comparisons
          </p>
          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              marginBottom: 16,
            }}
          >
            Aurict vs. the alternatives
          </h1>
          <p style={{ fontSize: 17, color: "var(--text-dim)", lineHeight: 1.7, maxWidth: 600 }}>
            How does Aurict compare to other AI coding tools? Here&apos;s an honest look at where it wins, where competitors have their strengths, and which tool fits which workflow.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {COMPARISONS.map((c) => (
            <CompareCard key={c.slug} {...c} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}

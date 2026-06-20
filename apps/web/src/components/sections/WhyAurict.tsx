"use client"
import { m } from "framer-motion"

const STATS = [
  {
    value: "9",
    label: "Specialist Agents",
    detail: "Each a domain expert — explore, code, review, test, debug, docs, security, perf, analytics.",
  },
  {
    value: "218+",
    label: "Contextual Skills",
    detail: "Your stack is detected before you say a word. The right context is injected automatically.",
  },
  {
    value: "3",
    label: "Native Platforms",
    detail: "Compiled binaries for macOS, Linux, and Windows. No runtime dependency. One command.",
  },
]

const DIFFERENTIATORS = [
  {
    index: "01",
    title: "Agent-first, not prompt-first",
    body: "Most tools wrap a single LLM call. Aurict routes every task to the right specialist — a dedicated agent with its own tools, context budget, and domain knowledge. Complex tasks are decomposed and run in parallel.",
  },
  {
    index: "02",
    title: "Zero-setup cross-platform",
    body: "Install with one npm command on any OS. Aurict ships native compiled binaries — no Node runtime required at execution time, no WSL on Windows, no Rosetta headaches on Apple Silicon.",
  },
  {
    index: "03",
    title: "Context that sees your codebase",
    body: "Before you ask your first question, Aurict has already read your directory tree, detected your framework, parsed your config, and ranked the files most likely to matter. No manual attachment, no copy-paste.",
  },
  {
    index: "04",
    title: "Open and yours to extend",
    body: "Bring your own MCP servers, custom slash commands, and team-shared skill templates. Your claude_desktop_config.json works out of the box. Nothing is locked into a proprietary cloud.",
  },
]

export function WhyAurict() {
  return (
    <section
      className="resp-section"
      style={{
        padding: "120px 24px",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      {/* header */}
      <div style={{ textAlign: "center", marginBottom: 80 }}>
        <m.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 12,
            color: "var(--accent)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Why Aurict
        </m.p>
        <m.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.08 }}
          style={{
            fontSize: "clamp(28px, 4.5vw, 52px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.12,
            color: "var(--text)",
            marginBottom: 20,
          }}
        >
          More than an assistant.
          <br />
          <span className="gradient-text">A complete agent runtime.</span>
        </m.h2>
        <m.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.18 }}
          style={{
            fontSize: 16,
            color: "var(--text-dim)",
            lineHeight: 1.7,
            maxWidth: 520,
            margin: "0 auto",
          }}
        >
          Most AI coding tools are a chat interface attached to a text editor.
          Aurict is engineered differently — from the architecture up.
        </m.p>
      </div>

      {/* stat row */}
      <div
        className="resp-grid-3"
        style={{
          background: "var(--border)",
          gap: 1,
          border: "1px solid var(--border)",
          borderRadius: 16,
          overflow: "hidden",
          marginBottom: 80,
        }}
      >
        {STATS.map((s, i) => (
          <m.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            style={{
              background: "var(--bg-subtle)",
              padding: "40px 36px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: "clamp(36px, 5vw, 60px)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                marginBottom: 10,
                background: "linear-gradient(135deg, #818cf8 0%, #c4b5fd 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: 10,
                letterSpacing: "-0.01em",
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-dim)",
                lineHeight: 1.6,
              }}
            >
              {s.detail}
            </div>
          </m.div>
        ))}
      </div>

      {/* differentiator rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {DIFFERENTIATORS.map((d, i) => (
          <m.div
            key={d.index}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="resp-diff"
            style={{
              padding: "32px 0",
              borderBottom: i < DIFFERENTIATORS.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: 12,
                color: "var(--text-muted)",
                letterSpacing: "0.04em",
                paddingTop: 3,
              }}
            >
              {d.index}
            </span>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--text)",
                letterSpacing: "-0.02em",
                lineHeight: 1.4,
              }}
            >
              {d.title}
            </h3>
            <p
              style={{
                fontSize: 14,
                color: "var(--text-dim)",
                lineHeight: 1.7,
              }}
            >
              {d.body}
            </p>
          </m.div>
        ))}
      </div>
    </section>
  )
}

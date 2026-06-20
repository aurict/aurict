"use client"
import { useState } from "react"
import { m } from "framer-motion"

const INSTALL_STEPS = [
  {
    step: "01",
    title: "Install",
    code: "npm install -g aurict",
    note: "Mac, Linux, Windows — one command.",
  },
  {
    step: "02",
    title: "Run",
    code: "aurict",
    note: "Launch in any project directory.",
  },
  {
    step: "03",
    title: "Configure",
    code: "# First-run wizard sets up provider & key",
    note: "Interactive setup — pick provider, enter API key, choose model.",
  },
]

export function Install() {
  const [copied, setCopied] = useState<string | null>(null)

  function copy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 1800)
  }

  return (
    <section
      id="install"
      style={{
        padding: "120px 24px",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 64 }}>
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
          Get started
        </m.p>
        <m.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          style={{
            fontSize: "clamp(28px, 4vw, 46px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "var(--text)",
          }}
        >
          Up and running in{" "}
          <span className="gradient-text">30 seconds.</span>
        </m.h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {INSTALL_STEPS.map((s, i) => (
          <m.div
            key={s.step}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "20px 28px",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-bright)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            <span
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: 12,
                color: "var(--accent)",
                width: 28,
                flexShrink: 0,
                letterSpacing: "0.04em",
              }}
            >
              {s.step}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-dim)",
                width: 90,
                flexShrink: 0,
              }}
            >
              {s.title}
            </span>
            <div
              style={{
                flex: 1,
                fontFamily: "var(--font-geist-mono)",
                fontSize: 14,
                color: "var(--text)",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "9px 16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                transition: "background 0.15s",
              }}
              onClick={() => copy(s.code)}
            >
              <span>
                {!s.code.startsWith("#") && (
                  <span style={{ color: "var(--accent)", marginRight: 8 }}>$</span>
                )}
                <span style={{ color: s.code.startsWith("#") ? "var(--text-muted)" : "var(--text)" }}>
                  {s.code}
                </span>
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: copied === s.code ? "var(--success)" : "var(--text-muted)",
                  transition: "color 0.2s",
                }}
              >
                {copied === s.code ? "copied!" : "copy"}
              </span>
            </div>
            <span
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                maxWidth: 180,
                lineHeight: 1.5,
              }}
            >
              {s.note}
            </span>
          </m.div>
        ))}
      </div>
    </section>
  )
}

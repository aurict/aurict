"use client"
import { useState } from "react"
import { motion } from "framer-motion"

const INSTALL_STEPS = [
  {
    step: "01",
    title: "Install",
    code: "npm install -g omnicod",
    note: "Mac, Linux, Windows — one command.",
  },
  {
    step: "02",
    title: "Run",
    code: "omnicod",
    note: "Launch in any project directory.",
  },
  {
    step: "03",
    title: "Configure",
    code: "omnicod /models",
    note: "Choose your provider and model.",
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
        <motion.p
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
        </motion.p>
        <motion.h2
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
        </motion.h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {INSTALL_STEPS.map((s, i) => (
          <motion.div
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
                <span style={{ color: "var(--accent)", marginRight: 8 }}>$</span>
                {s.code}
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
          </motion.div>
        ))}
      </div>
    </section>
  )
}

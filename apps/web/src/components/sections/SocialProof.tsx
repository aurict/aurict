"use client"
import { m } from "framer-motion"

const STATS = [
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
    label: "Open source on GitHub",
    href: "https://github.com/aurict/aurict",
    cta: "Star ★",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M0 0h24v24H0V0zm15.999 9.807l-3.998 3.998-3.999-3.998L6.587 11.22l5.414 5.413 5.413-5.413-1.415-1.413z" />
      </svg>
    ),
    label: "npm install -g aurict",
    href: "https://www.npmjs.com/package/aurict",
    cta: "View on npm",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    label: "MIT licensed — free forever",
    href: "https://github.com/aurict/aurict/blob/main/LICENSE",
    cta: "Read license",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    label: "macOS · Linux · Windows",
    href: "#install",
    cta: "See install options",
  },
]

export function SocialProof() {
  return (
    <section
      style={{
        padding: "48px 24px 64px",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-card)",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <m.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            textAlign: "center",
            fontSize: 12,
            fontFamily: "var(--font-geist-mono)",
            color: "var(--text-muted)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 32,
          }}
        >
          Free and open source
        </m.p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {STATS.map((s, i) => (
            <m.a
              key={s.label}
              href={s.href}
              target={s.href.startsWith("http") ? "_blank" : undefined}
              rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "16px 20px",
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--bg)",
                textDecoration: "none",
                color: "var(--text-dim)",
                transition: "border-color 0.2s, color 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)"
                e.currentTarget.style.color = "var(--text)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)"
                e.currentTarget.style.color = "var(--text-dim)"
              }}
            >
              <span style={{ color: "var(--accent)", flexShrink: 0 }}>{s.icon}</span>
              <span style={{ fontSize: 13, flex: 1, lineHeight: 1.4 }}>{s.label}</span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-geist-mono)",
                  color: "var(--accent)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {s.cta}
              </span>
            </m.a>
          ))}
        </div>
      </div>
    </section>
  )
}

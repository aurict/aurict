"use client"

export function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        padding: "48px 24px",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: 15,
              fontWeight: 700,
              color: "var(--text)",
              letterSpacing: "-0.02em",
            }}
          >
            aurict
          </span>
          <span style={{ color: "var(--border-bright)" }}>·</span>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>MIT License</span>
          <span style={{ color: "var(--border-bright)" }}>·</span>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>© 2026 aurict</span>
        </div>

        <div style={{ display: "flex", gap: 32 }}>
          {[
            { label: "GitHub", href: "https://github.com/aurict/aurict" },
            { label: "npm", href: "https://www.npmjs.com/package/aurict" },
            { label: "Docs", href: "/docs" },
            { label: "Changelog", href: "/changelog" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-dim)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}

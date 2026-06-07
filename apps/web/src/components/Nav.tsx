"use client"
import { useState, useEffect } from "react"
import Link from "next/link"

export function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: "all 0.3s ease",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        background: scrolled ? "rgba(10,10,10,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text)",
              letterSpacing: "-0.02em",
            }}
          >
            omnicod
          </span>
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--font-geist-mono)",
              color: "var(--accent)",
              background: "var(--accent-glow)",
              border: "1px solid rgba(129,140,248,0.3)",
              borderRadius: 4,
              padding: "2px 7px",
              letterSpacing: "0.05em",
            }}
          >
            v1.0
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <NavLink href="/docs">Docs</NavLink>
          <NavLink href="/changelog">Changelog</NavLink>
          <a
            href="https://github.com/omnicod-dev/omnicod"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--text-dim)",
              textDecoration: "none",
              fontSize: 14,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-dim)")}
          >
            GitHub
          </a>
          <a
            href="#waitlist"
            style={{
              background: "var(--accent)",
              color: "#fff",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
              padding: "7px 16px",
              borderRadius: 8,
              transition: "opacity 0.2s",
              letterSpacing: "0.01em",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Join waitlist
          </a>
        </div>
      </div>
    </nav>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{ color: "var(--text-dim)", textDecoration: "none", fontSize: 14, transition: "color 0.2s" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-dim)")}
    >
      {children}
    </Link>
  )
}

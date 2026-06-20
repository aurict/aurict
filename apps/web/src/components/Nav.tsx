"use client"
import { useState, useEffect } from "react"
import Link from "next/link"

export function Nav() {
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  // Close drawer on route change / resize
  useEffect(() => {
    const close = () => setMenuOpen(false)
    window.addEventListener("resize", close)
    return () => window.removeEventListener("resize", close)
  }, [])

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          transition: "all 0.3s ease",
          borderBottom: scrolled || menuOpen ? "1px solid var(--border)" : "1px solid transparent",
          background: scrolled || menuOpen ? "rgba(10,10,10,0.92)" : "transparent",
          backdropFilter: scrolled || menuOpen ? "blur(16px)" : "none",
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
              aurict
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
              v1.0.6
            </span>
          </Link>

          {/* Desktop links */}
          <div className="nav-links">
            <NavLink href="/docs">Docs</NavLink>
            <NavLink href="/changelog">Changelog</NavLink>
            <a
              href="https://github.com/aurict/aurict"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--text-dim)", textDecoration: "none", fontSize: 14, transition: "color 0.2s" }}
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

          {/* Mobile hamburger */}
          <button
            className="nav-burger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="4" x2="18" y2="18" />
                <line x1="18" y1="4" x2="4" y2="18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6"  x2="19" y2="6"  />
                <line x1="3" y1="11" x2="19" y2="11" />
                <line x1="3" y1="16" x2="19" y2="16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="nav-drawer" onClick={() => setMenuOpen(false)}>
          <Link href="/docs"      onClick={() => setMenuOpen(false)}>Docs</Link>
          <Link href="/changelog" onClick={() => setMenuOpen(false)}>Changelog</Link>
          <a href="https://github.com/aurict/aurict" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="#waitlist" onClick={() => setMenuOpen(false)} style={{ color: "var(--accent)", fontWeight: 600 }}>
            Join waitlist →
          </a>
        </div>
      )}
    </>
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

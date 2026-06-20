"use client"
import { m } from "framer-motion"
import { TerminalWindow } from "@/components/terminal/TerminalWindow"

export function Hero() {
  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 24px 80px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* radial glow background */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(129,140,248,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 860, width: "100%", textAlign: "center", position: "relative", zIndex: 1 }}>
        {/* pill badge */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 28 }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "var(--font-geist-mono)",
              fontSize: 12,
              color: "var(--accent)",
              background: "var(--accent-glow)",
              border: "1px solid rgba(129,140,248,0.25)",
              borderRadius: 100,
              padding: "6px 16px",
              letterSpacing: "0.08em",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--accent)",
                boxShadow: "0 0 8px var(--accent)",
              }}
            />
            v1.0.6 — Open Source
          </span>
        </m.div>

        {/* headline */}
        <m.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            fontSize: "clamp(40px, 7vw, 76px)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.08,
            marginBottom: 24,
          }}
        >
          <span style={{ color: "var(--text)" }}>The terminal AI</span>
          <br />
          <span className="gradient-text">that actually thinks.</span>
        </m.h1>

        {/* subheadline */}
        <m.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.22 }}
          style={{
            fontSize: 18,
            color: "var(--text-dim)",
            lineHeight: 1.7,
            maxWidth: 560,
            margin: "0 auto 40px",
          }}
        >
          9 specialist agents. 218+ contextual skills. Bash classifier. MCP client.
          One command to rule your entire codebase.
        </m.p>

        {/* CTA row */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.34 }}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap", marginBottom: 72 }}
        >
          <a
            href="#waitlist"
            style={{
              background: "var(--accent)",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 15,
              padding: "14px 28px",
              borderRadius: 10,
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)"
              e.currentTarget.style.boxShadow = "0 8px 30px rgba(129,140,248,0.35)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "none"
            }}
          >
            Join the waitlist
          </a>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontFamily: "var(--font-geist-mono)",
              fontSize: 13,
              color: "var(--text-dim)",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "12px 20px",
            }}
          >
            <span style={{ color: "var(--accent)" }}>$</span>
            <span>npm install -g aurict</span>
          </div>
        </m.div>

        {/* terminal demo */}
        <m.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          style={{ maxWidth: 780, margin: "0 auto" }}
        >
          <TerminalWindow />
        </m.div>
      </div>
    </section>
  )
}

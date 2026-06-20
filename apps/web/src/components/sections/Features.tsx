"use client"
import React from "react"
import { m } from "framer-motion"
import { FEATURES } from "@/lib/constants"

// ─── SVG icon set ─────────────────────────────────────────────────────────────

function IconAgents({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="3.5" r="2" />
      <circle cx="3.5" cy="16" r="2" />
      <circle cx="16.5" cy="16" r="2" />
      <line x1="10" y1="5.5" x2="4.5" y2="14.1" />
      <line x1="10" y1="5.5" x2="15.5" y2="14.1" />
      <line x1="5.4"  y1="16" x2="14.6" y2="16"  />
    </svg>
  )
}

function IconSkills({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.5 2h-5L6 9h3.5L7 18l9-11h-4.5l1-5z" />
    </svg>
  )
}

function IconClassifier({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2L3 5v5c0 4.5 3 8.1 7 9 4-.9 7-4.5 7-9V5L10 2z" />
      <polyline points="7,10 9,12 13,8" />
    </svg>
  )
}

function IconSandbox({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2l7.5 4v8L10 18l-7.5-4V6L10 2z" />
      <polyline points="2.5,6 10,10 17.5,6" />
      <line x1="10" y1="10" x2="10" y2="18" />
    </svg>
  )
}

function IconMcp({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7.5" />
      <circle cx="10" cy="10" r="2.5" />
      <line x1="10" y1="2.5"  x2="10" y2="7.5"  />
      <line x1="10" y1="12.5" x2="10" y2="17.5" />
      <line x1="2.5"  y1="10" x2="7.5"  y2="10" />
      <line x1="12.5" y1="10" x2="17.5" y2="10" />
    </svg>
  )
}

function IconDesign({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l4-4 1.5 1.5L3 17z" />
      <path d="M7 13l8-8 2 2-8 8-2-2z" />
      <path d="M14 2l4 4" />
      <circle cx="16" cy="4" r="1.5" fill={color} stroke="none" />
    </svg>
  )
}

function IconWindows({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="16" height="11" rx="2" />
      <line x1="7"  y1="18" x2="13" y2="18" />
      <line x1="10" y1="14" x2="10" y2="18" />
      <line x1="2"  y1="9"  x2="18" y2="9"  />
      <line x1="9"  y1="3"  x2="9"  y2="9"  />
    </svg>
  )
}

function IconMemory({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="10" cy="5.5" rx="6.5" ry="2.5" />
      <path d="M3.5 5.5v4c0 1.38 2.91 2.5 6.5 2.5s6.5-1.12 6.5-2.5v-4" />
      <path d="M3.5 9.5v4c0 1.38 2.91 2.5 6.5 2.5s6.5-1.12 6.5-2.5v-4" />
    </svg>
  )
}

const ICON_MAP: Record<string, (props: { color: string }) => React.ReactElement> = {
  agents:     IconAgents,
  skills:     IconSkills,
  classifier: IconClassifier,
  sandbox:    IconSandbox,
  mcp:        IconMcp,
  design:     IconDesign,
  windows:    IconWindows,
  memory:     IconMemory,
}

// ─── Features section ─────────────────────────────────────────────────────────

export function Features() {
  return (
    <section
      id="features"
      style={{
        padding: "120px 24px",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      {/* section header */}
      <div style={{ textAlign: "center", marginBottom: 72 }}>
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
          Capabilities
        </m.p>
        <m.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.08 }}
          style={{
            fontSize: "clamp(30px, 5vw, 52px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.12,
            color: "var(--text)",
          }}
        >
          Not just autocomplete.
          <br />
          <span className="gradient-text">An AI team in your terminal.</span>
        </m.h2>
      </div>

      {/* feature grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          background: "var(--border)",
          gap: 1,
          border: "1px solid var(--border)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {FEATURES.map((feature, i) => {
          const IconComponent = ICON_MAP[feature.icon]
          return (
            <m.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              style={{
                padding: "32px 36px",
                background: "var(--bg-subtle)",
                transition: "background 0.2s",
                cursor: "default",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-card)" }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-subtle)" }}
            >
              {/* colored accent top line */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: `linear-gradient(90deg, ${feature.color}50, transparent)`,
                }}
              />

              <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: `${feature.color}12`,
                    border: `1px solid ${feature.color}28`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {IconComponent && <IconComponent color={feature.color} />}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "var(--text)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {feature.title}
                    </h3>
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: "var(--font-geist-mono)",
                        color: feature.color,
                        background: `${feature.color}12`,
                        border: `1px solid ${feature.color}28`,
                        borderRadius: 4,
                        padding: "2px 7px",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {feature.tag}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--text-dim)",
                      lineHeight: 1.6,
                    }}
                  >
                    {feature.description}
                  </p>
                </div>
              </div>
            </m.div>
          )
        })}
      </div>
    </section>
  )
}

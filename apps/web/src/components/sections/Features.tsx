"use client"
import { motion } from "framer-motion"
import { FEATURES } from "@/lib/constants"

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
        <motion.p
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
        </motion.p>
        <motion.h2
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
        </motion.h2>
      </div>

      {/* feature grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: 1,
          border: "1px solid var(--border)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {FEATURES.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.07 }}
            whileHover={{ background: "var(--bg-card)" } as never}
            style={{
              padding: "32px 36px",
              background: "var(--bg-subtle)",
              borderRight: (i % 2 === 0 && i < FEATURES.length - 1) ? "1px solid var(--border)" : "none",
              borderBottom: i < FEATURES.length - 2 ? "1px solid var(--border)" : "none",
              transition: "background 0.2s",
              cursor: "default",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* colored accent top line */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: `linear-gradient(90deg, ${feature.color}40, transparent)`,
              }}
            />

            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: `${feature.color}14`,
                  border: `1px solid ${feature.color}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                {feature.icon}
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
                      background: `${feature.color}14`,
                      border: `1px solid ${feature.color}30`,
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
          </motion.div>
        ))}
      </div>
    </section>
  )
}

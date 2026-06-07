"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PRO_FEATURES } from "@/lib/constants"

const WAITLIST_COUNT_BASE = 847

export function Waitlist() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState(WAITLIST_COUNT_BASE)
  const [error, setError] = useState("")

  useEffect(() => {
    const stored = localStorage.getItem("wl_count")
    if (stored) setCount(parseInt(stored, 10))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes("@")) { setError("Enter a valid email."); return }
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) throw new Error("Failed")

      const next = count + 1
      setCount(next)
      localStorage.setItem("wl_count", String(next))
      setSubmitted(true)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      id="waitlist"
      style={{
        padding: "120px 24px",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 60,
          alignItems: "start",
        }}
      >
        {/* left — form */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: 12,
              color: "var(--accent)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            Early access
          </p>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 46px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              marginBottom: 20,
            }}
          >
            <span style={{ color: "var(--text)" }}>Be first.</span>
            <br />
            <span className="gradient-text">Shape the product.</span>
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-dim)", lineHeight: 1.7, marginBottom: 36 }}>
            OmniCod is free and open source. Pro features are coming — early members get founding pricing, priority access, and a direct line to the team.
          </p>

          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: "rgba(78,186,101,0.08)",
                  border: "1px solid rgba(78,186,101,0.3)",
                  borderRadius: 12,
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <span style={{ fontSize: 22 }}>✓</span>
                <div>
                  <p style={{ color: "var(--success)", fontWeight: 700, fontSize: 15 }}>
                    You&apos;re on the list!
                  </p>
                  <p style={{ color: "var(--text-dim)", fontSize: 13, marginTop: 2 }}>
                    #{count} — we&apos;ll email you when Pro launches.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      flex: 1,
                      background: "var(--bg-card)",
                      border: `1px solid ${error ? "var(--error)" : "var(--border)"}`,
                      borderRadius: 10,
                      padding: "13px 18px",
                      color: "var(--text)",
                      fontSize: 14,
                      outline: "none",
                      transition: "border-color 0.2s",
                      fontFamily: "var(--font-geist-sans)",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = error ? "var(--error)" : "var(--border)")}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      background: "var(--accent)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      padding: "13px 24px",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: loading ? "wait" : "pointer",
                      opacity: loading ? 0.7 : 1,
                      transition: "opacity 0.2s, transform 0.15s",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = "translateY(-1px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                  >
                    {loading ? "Joining..." : "Join →"}
                  </button>
                </div>
                {error && (
                  <p style={{ fontSize: 12, color: "var(--error)", fontFamily: "var(--font-geist-mono)" }}>
                    {error}
                  </p>
                )}
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "var(--success)",
                      marginRight: 7,
                      verticalAlign: "middle",
                    }}
                  />
                  {count.toLocaleString()} developers already joined
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {/* right — pro preview (blurred) */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.12 }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>OmniCod Pro</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Coming soon</p>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: 11,
                  color: "var(--accent-alt)",
                  background: "rgba(167,139,250,0.1)",
                  border: "1px solid rgba(167,139,250,0.25)",
                  borderRadius: 6,
                  padding: "4px 10px",
                }}
              >
                Founding pricing
              </span>
            </div>

            {/* features list */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              {PRO_FEATURES.map((f) => (
                <div key={f.title} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "var(--accent-glow)",
                      border: "1px solid rgba(129,140,248,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <span style={{ fontSize: 10, color: "var(--accent)" }}>✓</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{f.title}</p>
                    <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>{f.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* blur overlay */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "55%",
                background: "linear-gradient(to bottom, transparent, var(--bg-card))",
                backdropFilter: "blur(3px)",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                paddingBottom: 24,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: 12,
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "6px 14px",
                  backdropFilter: "blur(8px)",
                }}
              >
                Unlock with early access →
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

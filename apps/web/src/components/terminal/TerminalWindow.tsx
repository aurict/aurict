"use client"
import { useState, useEffect, useRef } from "react"
import { TERMINAL_SCENARIOS } from "@/lib/constants"

type LineType = "input" | "system" | "tool" | "output"

interface Line {
  type: LineType
  text: string
}

const LINE_COLORS: Record<LineType, string> = {
  input:  "var(--text)",
  system: "var(--text-dim)",
  tool:   "var(--accent)",
  output: "#a3c4a8",
}

const PAUSE_BETWEEN = 1200

export function TerminalWindow() {
  const [scenarioIdx, setScenarioIdx] = useState(0)
  const [visibleLines, setVisibleLines] = useState<Line[]>([])
  const [cursor, setCursor] = useState(true)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const interval = setInterval(() => setCursor((c) => !c), 530)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []

    const scenario = TERMINAL_SCENARIOS[scenarioIdx]
    const reset = setTimeout(() => setVisibleLines([]), 0)
    timeoutsRef.current.push(reset)

    scenario.lines.forEach((line) => {
      const t = setTimeout(() => {
        setVisibleLines((prev) => [...prev, { type: line.type as LineType, text: line.text }])
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
      }, line.delay)
      timeoutsRef.current.push(t)
    })

    const lastDelay = scenario.lines[scenario.lines.length - 1].delay
    const next = setTimeout(() => {
      setScenarioIdx((i) => (i + 1) % TERMINAL_SCENARIOS.length)
    }, lastDelay + PAUSE_BETWEEN)
    timeoutsRef.current.push(next)

    return () => timeoutsRef.current.forEach(clearTimeout)
  }, [scenarioIdx])

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 40px 80px rgba(0,0,0,0.6)",
      }}
    >
      {/* title bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          background: "rgba(255,255,255,0.02)",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {["#ff5f56", "#ffbd2e", "#27c93f"].map((c) => (
            <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontFamily: "var(--font-geist-mono)",
            fontSize: 12,
            color: "var(--text-muted)",
          }}
        >
          aurict — my-project
        </div>
        {/* scenario tabs */}
        <div style={{ display: "flex", gap: 6 }}>
          {TERMINAL_SCENARIOS.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setScenarioIdx(i)}
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 4,
                border: "1px solid",
                borderColor: i === scenarioIdx ? "var(--accent)" : "var(--border)",
                background: i === scenarioIdx ? "var(--accent-glow)" : "transparent",
                color: i === scenarioIdx ? "var(--accent)" : "var(--text-muted)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* terminal body */}
      <div
        ref={containerRef}
        style={{
          fontFamily: "var(--font-geist-mono)",
          fontSize: 13,
          lineHeight: 1.7,
          padding: "20px 24px",
          height: 340,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {visibleLines.map((line, i) => (
          <div key={i} style={{ color: LINE_COLORS[line.type], display: "flex", gap: 0 }}>
            <span style={{ whiteSpace: "pre-wrap" }}>{line.text}</span>
          </div>
        ))}
        {/* cursor line */}
        <div style={{ color: "var(--accent)", display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          <span>❯</span>
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 16,
              background: "var(--accent)",
              opacity: cursor ? 1 : 0,
              transition: "opacity 0.1s",
            }}
          />
        </div>
      </div>
    </div>
  )
}

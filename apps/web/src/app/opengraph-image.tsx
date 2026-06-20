import { ImageResponse } from "next/og"

export const runtime     = "edge"
export const alt         = "Aurict — Terminal AI Coding Assistant"
export const size        = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width:           "100%",
          height:          "100%",
          display:         "flex",
          flexDirection:   "column",
          justifyContent:  "space-between",
          background:      "#0a0a0a",
          padding:         "64px 72px",
          fontFamily:      "monospace",
          position:        "relative",
          overflow:        "hidden",
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position:   "absolute",
            top:        0,
            left:       0,
            right:      0,
            height:     3,
            background: "linear-gradient(90deg, #818cf8, #a78bfa, #c4b5fd)",
            display:    "flex",
          }}
        />

        {/* Radial glow */}
        <div
          style={{
            position:     "absolute",
            top:          -200,
            right:        -200,
            width:        700,
            height:       700,
            borderRadius: "50%",
            background:   "radial-gradient(ellipse, rgba(129,140,248,0.08) 0%, transparent 65%)",
            display:      "flex",
          }}
        />

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Diamond icon */}
            <div
              style={{
                width:        44,
                height:       44,
                background:   "rgba(129,140,248,0.15)",
                border:       "1px solid rgba(129,140,248,0.3)",
                borderRadius: 10,
                display:      "flex",
                alignItems:   "center",
                justifyContent: "center",
                fontSize:     22,
                color:        "#818cf8",
              }}
            >
              ◈
            </div>
            <span style={{ fontSize: 36, fontWeight: 700, color: "#f5f5f5", letterSpacing: "-1px" }}>
              aurict
            </span>
          </div>

          <div
            style={{
              fontSize:     14,
              color:        "#818cf8",
              background:   "rgba(129,140,248,0.1)",
              border:       "1px solid rgba(129,140,248,0.25)",
              borderRadius: 8,
              padding:      "6px 16px",
              letterSpacing: "1px",
              display:      "flex",
            }}
          >
            v1.0.6 · Open Source
          </div>
        </div>

        {/* Main headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize:      72,
              fontWeight:    800,
              color:         "#f5f5f5",
              lineHeight:    1.05,
              letterSpacing: "-3px",
              display:       "flex",
              flexWrap:      "wrap",
            }}
          >
            Terminal AI
          </div>
          <div
            style={{
              fontSize:      72,
              fontWeight:    800,
              lineHeight:    1.05,
              letterSpacing: "-3px",
              background:    "linear-gradient(135deg, #818cf8, #a78bfa, #c4b5fd)",
              WebkitBackgroundClip: "text",
              color:         "transparent",
              display:       "flex",
            }}
          >
            Coding Assistant
          </div>
          <div style={{ fontSize: 22, color: "#71717a", marginTop: 8, display: "flex" }}>
            Open-source · Multi-agent · 9 providers · No IDE required
          </div>
        </div>

        {/* Bottom row — stats + install */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          {/* Stat pills */}
          <div style={{ display: "flex", gap: 12 }}>
            {[
              ["9", "specialist agents"],
              ["218+", "contextual skills"],
              ["3", "native platforms"],
            ].map(([val, label]) => (
              <div
                key={label}
                style={{
                  display:      "flex",
                  flexDirection: "column",
                  gap:          4,
                  background:   "#141414",
                  border:       "1px solid #262626",
                  borderRadius: 12,
                  padding:      "14px 20px",
                }}
              >
                <span style={{ fontSize: 28, fontWeight: 800, color: "#818cf8", lineHeight: 1 }}>{val}</span>
                <span style={{ fontSize: 13, color: "#71717a" }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Install command */}
          <div
            style={{
              display:      "flex",
              alignItems:   "center",
              gap:          10,
              background:   "#141414",
              border:       "1px solid #333",
              borderRadius: 12,
              padding:      "16px 24px",
              fontSize:     16,
              color:        "#f5f5f5",
            }}
          >
            <span style={{ color: "#818cf8" }}>$</span>
            <span>npm install -g aurict</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}

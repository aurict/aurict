"use client"
import { useState } from "react"

interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
}

export function CodeBlock({ code, language = "bash", filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      style={{
        position: "relative",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
          borderBottom: "1px solid var(--border)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontFamily: "var(--font-geist-mono)",
            color: "var(--text-muted)",
          }}
        >
          {filename || language}
        </span>
        <button
          onClick={handleCopy}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 8px",
            borderRadius: 4,
            fontSize: 12,
            fontFamily: "var(--font-geist-mono)",
            color: copied ? "var(--success)" : "var(--text-muted)",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (!copied) e.currentTarget.style.color = "var(--text)"
          }}
          onMouseLeave={(e) => {
            if (!copied) e.currentTarget.style.color = "var(--text-muted)"
          }}
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <pre
        style={{
          padding: "16px 20px",
          margin: 0,
          overflowX: "auto",
          fontSize: 13,
          fontFamily: "var(--font-geist-mono)",
          lineHeight: 1.65,
          color: "var(--text)",
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  )
}

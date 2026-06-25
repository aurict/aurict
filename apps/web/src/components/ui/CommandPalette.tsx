"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface CommandItem {
  label: string
  href: string
  icon?: string
  category: string
}

const COMMANDS: CommandItem[] = [
  // Pages
  { label: "Home", href: "/", category: "Pages", icon: "🏠" },
  { label: "Documentation", href: "/docs", category: "Pages", icon: "📖" },
  { label: "Changelog", href: "/changelog", category: "Pages", icon: "📋" },
  { label: "Blog", href: "/blog", category: "Pages", icon: "✍️" },

  // Sections
  { label: "Features", href: "/#features", category: "Sections", icon: "⚡" },
  { label: "Install", href: "/#install", category: "Sections", icon: "📦" },
  { label: "FAQ", href: "/#faq", category: "Sections", icon: "❓" },
  { label: "Install", href: "/#install", category: "Sections", icon: "📦" },

  // Compare
  { label: "All Comparisons", href: "/compare", category: "Compare", icon: "⚖️" },
  { label: "vs Claude Code", href: "/compare/claude-code", category: "Compare", icon: "⚔️" },
  { label: "vs Cursor", href: "/compare/cursor", category: "Compare", icon: "⚔️" },
  { label: "vs Aider", href: "/compare/aider", category: "Compare", icon: "⚔️" },
  { label: "vs GitHub Copilot", href: "/compare/github-copilot", category: "Compare", icon: "⚔️" },

  // Use Cases
  { label: "Refactoring", href: "/use-cases/refactoring", category: "Use Cases", icon: "🔄" },
  { label: "Code Review", href: "/use-cases/code-review", category: "Use Cases", icon: "🔍" },
  { label: "Testing", href: "/use-cases/testing", category: "Use Cases", icon: "🧪" },
  { label: "Documentation", href: "/use-cases/documentation", category: "Use Cases", icon: "📝" },

  // External
  { label: "GitHub", href: "https://github.com/aurict/aurict", category: "External", icon: "🐙" },
  { label: "npm", href: "https://www.npmjs.com/package/aurict", category: "External", icon: "📦" },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Filter commands based on query
  const filtered = COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  )

  // Group by category
  const grouped = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = []
    acc[cmd.category].push(cmd)
    return acc
  }, {} as Record<string, CommandItem[]>)

  // Keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === "Escape" && open) {
        setOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open])

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
    if (!open) {
      setQuery("")
      setSelectedIndex(0)
    }
  }, [open])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault()
      const cmd = filtered[selectedIndex]
      setOpen(false)
      if (cmd.href.startsWith("http")) {
        window.open(cmd.href, "_blank")
      } else {
        router.push(cmd.href)
      }
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
          zIndex: 1000,
        }}
      />

      {/* Palette */}
      <div
        style={{
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 560,
          maxHeight: "60vh",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          zIndex: 1001,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages, sections, commands..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              fontSize: 15,
              color: "var(--text)",
              fontFamily: "var(--font-geist-sans)",
            }}
          />
          <kbd
            style={{
              fontSize: 11,
              fontFamily: "var(--font-geist-mono)",
              color: "var(--text-muted)",
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              padding: "2px 6px",
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          style={{
            overflowY: "auto",
            padding: "8px 0",
          }}
        >
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-geist-mono)",
                  color: "var(--text-muted)",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  padding: "8px 20px 4px",
                }}
              >
                {category}
              </div>
              {items.map((cmd) => {
                const globalIndex = filtered.indexOf(cmd)
                const isSelected = globalIndex === selectedIndex

                return (
                  <Link
                    key={cmd.href}
                    href={cmd.href}
                    onClick={(e) => {
                      if (cmd.href.startsWith("http")) {
                        e.preventDefault()
                        window.open(cmd.href, "_blank")
                      }
                      setOpen(false)
                    }}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 20px",
                      textDecoration: "none",
                      background: isSelected ? "var(--accent-glow)" : "transparent",
                      transition: "background 0.1s",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{cmd.icon}</span>
                    <span
                      style={{
                        fontSize: 14,
                        color: isSelected ? "var(--text)" : "var(--text-dim)",
                        fontWeight: isSelected ? 500 : 400,
                      }}
                    >
                      {cmd.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          ))}

          {filtered.length === 0 && (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 14,
              }}
            >
              No results found
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "12px 20px",
            borderTop: "1px solid var(--border)",
            fontSize: 12,
            color: "var(--text-muted)",
            fontFamily: "var(--font-geist-mono)",
          }}
        >
          <span>
            <kbd style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 3, padding: "1px 4px" }}>↑↓</kbd> navigate
          </span>
          <span>
            <kbd style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 3, padding: "1px 4px" }}>↵</kbd> select
          </span>
        </div>
      </div>
    </>
  )
}

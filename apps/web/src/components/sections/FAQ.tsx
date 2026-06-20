"use client"
import { useState } from "react"
import { m, AnimatePresence } from "framer-motion"

const FAQS = [
  {
    q: "Is Aurict free?",
    a: "Yes — Aurict is fully open source under the MIT license. You bring your own API key for whichever AI provider you choose. There are no subscription fees for the core tool. Pro features (cloud sync, team workspaces, analytics) are planned and will have a paid tier.",
  },
  {
    q: "How is Aurict different from Claude Code?",
    a: "Claude Code is tied to a single provider (Anthropic) and tightly integrated with the Claude.ai ecosystem. Aurict supports 9 providers (Anthropic, OpenAI, Google, OpenRouter, xAI, Azure, AWS Bedrock, Ollama and more), ships with 9 specialist agents, 218+ auto-injected skills, a bash command classifier, and runs as a native compiled binary — no Node.js runtime required.",
  },
  {
    q: "Does Aurict work on Windows?",
    a: "Yes. Aurict ships a native compiled binary for Windows x64 — no WSL, no PowerShell gymnastics, no extra runtime. Shell detection auto-picks Git Bash, MSYS2, or PowerShell as fallback.",
  },
  {
    q: "Which AI providers does Aurict support?",
    a: "Anthropic (Claude), OpenAI (GPT-4o, o1, o3), Google (Gemini), OpenRouter, xAI (Grok), Azure OpenAI, AWS Bedrock, Ollama (local models), and OpenCode. Switch between them at any time with /providers.",
  },
  {
    q: "Do I need Node.js installed?",
    a: "No. Aurict installs via npm install -g aurict but runs as a self-contained native binary. Node.js is only needed for the install step itself, not for running the tool.",
  },
  {
    q: "Can I use my existing MCP servers?",
    a: "Yes — Aurict reads your claude_desktop_config.json automatically. Any MCP server you've already configured for Claude Desktop works immediately without any extra setup.",
  },
  {
    q: "How do I add my API key?",
    a: "The first time you run Aurict, an interactive setup wizard walks you through choosing a provider and entering your API key. You can also use /config set <provider> <key> at any time inside the terminal UI.",
  },
]

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section
      id="faq"
      className="resp-subsection"
      style={{ padding: "120px 24px", maxWidth: 780, margin: "0 auto" }}
    >
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <m.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{
            fontFamily:    "var(--font-geist-mono)",
            fontSize:      12,
            color:         "var(--accent)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom:  16,
          }}
        >
          FAQ
        </m.p>
        <m.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          style={{
            fontSize:      "clamp(26px, 4vw, 44px)",
            fontWeight:    800,
            letterSpacing: "-0.03em",
            color:         "var(--text)",
          }}
        >
          Common questions
        </m.h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)", borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)" }}>
        {FAQS.map((item, i) => {
          const isOpen = open === i
          return (
            <div key={i} style={{ background: "var(--bg-subtle)" }}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                style={{
                  width:          "100%",
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "space-between",
                  gap:            16,
                  padding:        "20px 24px",
                  background:     "none",
                  border:         "none",
                  cursor:         "pointer",
                  textAlign:      "left",
                  transition:     "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(129,140,248,0.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", lineHeight: 1.4 }}>
                  {item.q}
                </span>
                <span
                  style={{
                    flexShrink:  0,
                    width:       22,
                    height:      22,
                    borderRadius: "50%",
                    background:  isOpen ? "var(--accent)" : "var(--bg-card)",
                    border:      `1px solid ${isOpen ? "var(--accent)" : "var(--border-bright)"}`,
                    display:     "flex",
                    alignItems:  "center",
                    justifyContent: "center",
                    color:       isOpen ? "#fff" : "var(--text-dim)",
                    fontSize:    16,
                    lineHeight:  1,
                    transition:  "all 0.2s",
                  }}
                >
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <m.div
                    key="answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    style={{ overflow: "hidden" }}
                  >
                    <p
                      style={{
                        padding:    "0 24px 20px",
                        fontSize:   14,
                        color:      "var(--text-dim)",
                        lineHeight: 1.7,
                      }}
                    >
                      {item.a}
                    </p>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </section>
  )
}

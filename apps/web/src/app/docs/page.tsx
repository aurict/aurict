import { Nav } from "@/components/Nav"
import { Footer } from "@/components/sections/Footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Docs — OmniCod",
  description: "OmniCod documentation — configuration, custom tools, skills, and more.",
}

const DOCS_SECTIONS = [
  {
    title: "Installation",
    anchor: "installation",
    content: [
      {
        heading: "npm (recommended)",
        body: "Install the global binary via npm — installs the platform-specific binary for macOS (arm64, x64), Linux (x64, arm64).",
        code: "npm install -g omnicod",
      },
      {
        heading: "Build from source",
        body: "Clone the repo and build with Bun:",
        code: "git clone https://github.com/omnicod-dev/omnicod\ncd omnicod\nbun install\nbun run build",
      },
    ],
  },
  {
    title: "Configuration",
    anchor: "configuration",
    content: [
      {
        heading: "Project config — .omnicod/config.json",
        body: "Place a config file in your project root or in ~/.omnicod/ for global settings:",
        code: `{\n  "provider": "anthropic",\n  "model": "claude-opus-4-5",\n  "maxTokens": 8192\n}`,
      },
      {
        heading: "Environment variables",
        body: "API keys are read from your environment.",
        code: "ANTHROPIC_API_KEY=sk-ant-...\nOPENAI_API_KEY=sk-...",
      },
    ],
  },
  {
    title: "Custom Tools",
    anchor: "custom-tools",
    content: [
      {
        heading: "Creating a tool",
        body: "Drop a .js ESM file in ~/.omnicod/tools/ (global) or .omnicod/tools/ (project). Project tools override global tools with the same id.",
        code: `// .omnicod/tools/my-tool.js\nexport default {\n  id: "my-tool",\n  description: "What this tool does",\n  parameters: {\n    type: "object",\n    properties: {\n      input: { type: "string", description: "Input text" }\n    },\n    required: ["input"]\n  },\n  async execute({ input }, ctx) {\n    return { output: input.toUpperCase() }\n  }\n}`,
      },
    ],
  },
  {
    title: "Custom Skills",
    anchor: "custom-skills",
    content: [
      {
        heading: "Creating a skill",
        body: "Skills are Markdown files injected into the system prompt. Place them in ~/.omnicod/skills/ or .omnicod/skills/.",
        code: `<!-- .omnicod/skills/my-skill.md -->\n---\nname: my-skill\ndescription: Guides the assistant on our coding conventions\n---\n\nAlways use 2-space indentation.\nPrefer functional components over class components.\nNever use var, always const or let.`,
      },
    ],
  },
  {
    title: "MCP Integration",
    anchor: "mcp",
    content: [
      {
        heading: "Using your existing MCP config",
        body: "OmniCod reads your claude_desktop_config.json automatically. Any MCP server you've already configured works out of the box.",
        code: `# macOS\n~/Library/Application Support/Claude/claude_desktop_config.json\n\n# Linux\n~/.config/Claude/claude_desktop_config.json`,
      },
    ],
  },
]

export default function DocsPage() {
  return (
    <>
      <Nav />
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "100px 24px 80px" }}>
        <div style={{ marginBottom: 60 }}>
          <p
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: 12,
              color: "var(--accent)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Documentation
          </p>
          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 54px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--text)",
              marginBottom: 16,
            }}
          >
            Getting started
          </h1>
          <p style={{ fontSize: 16, color: "var(--text-dim)", lineHeight: 1.7, maxWidth: 580 }}>
            Everything you need to install, configure, and extend OmniCod.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 60 }}>
          <nav style={{ position: "sticky", top: 80, alignSelf: "start" }}>
            <p
              style={{
                fontSize: 11,
                fontFamily: "var(--font-geist-mono)",
                color: "var(--text-muted)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              On this page
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {DOCS_SECTIONS.map((s) => (
                <a key={s.anchor} href={`#${s.anchor}`} className="docs-sidebar-link">
                  {s.title}
                </a>
              ))}
            </div>
          </nav>

          <div style={{ display: "flex", flexDirection: "column", gap: 64 }}>
            {DOCS_SECTIONS.map((section) => (
              <div key={section.anchor} id={section.anchor}>
                <h2
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: "var(--text)",
                    letterSpacing: "-0.02em",
                    marginBottom: 28,
                    paddingBottom: 14,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {section.title}
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                  {section.content.map((item) => (
                    <div key={item.heading}>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>
                        {item.heading}
                      </h3>
                      <p
                        style={{
                          fontSize: 14,
                          color: "var(--text-dim)",
                          lineHeight: 1.7,
                          marginBottom: 14,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {item.body}
                      </p>
                      <pre
                        style={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--border)",
                          borderRadius: 10,
                          padding: "16px 20px",
                          fontSize: 13,
                          fontFamily: "var(--font-geist-mono)",
                          color: "var(--text)",
                          overflowX: "auto",
                          lineHeight: 1.65,
                        }}
                      >
                        <code>{item.code}</code>
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

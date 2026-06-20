import { Nav } from "@/components/Nav"
import { Footer } from "@/components/sections/Footer"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { CodeBlock } from "@/components/ui/CodeBlock"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  readTime: string
  category: string
  content: {
    type: "paragraph" | "heading" | "code" | "list"
    text?: string
    language?: string
    items?: string[]
  }[]
}

const POSTS: BlogPost[] = [
  {
    slug: "how-to-use-ai-coding-assistant",
    title: "How to Use an AI Coding Assistant in 2026",
    description: "A practical guide to getting started with AI coding assistants. Learn best practices, common pitfalls, and how to maximize productivity with terminal-based AI tools.",
    date: "2026-06-15",
    readTime: "8 min read",
    category: "Tutorial",
    content: [
      { type: "heading", text: "Getting Started with AI Coding Assistants" },
      { type: "paragraph", text: "AI coding assistants have evolved from simple autocomplete tools into sophisticated development partners. In 2026, terminal-based AI assistants like Aurict offer multi-agent orchestration, contextual skills, and deep codebase understanding." },
      { type: "heading", text: "Choosing the Right Tool" },
      { type: "paragraph", text: "When selecting an AI coding assistant, consider these factors:" },
      { type: "list", items: [
        "Provider flexibility — Can you switch between Anthropic, OpenAI, Google, and others?",
        "Agent architecture — Does it use specialist agents or a single model?",
        "Context awareness — Does it understand your codebase automatically?",
        "Platform support — Does it work on macOS, Linux, and Windows natively?",
      ]},
      { type: "heading", text: "Installation and Setup" },
      { type: "paragraph", text: "Installing Aurict takes less than a minute:" },
      { type: "code", language: "bash", text: "npm install -g aurict\naurict" },
      { type: "paragraph", text: "The first-run wizard guides you through provider selection and API key configuration." },
      { type: "heading", text: "Best Practices" },
      { type: "paragraph", text: "To get the most out of your AI coding assistant:" },
      { type: "list", items: [
        "Be specific in your requests — vague prompts get vague results",
        "Use the right agent for the task — explore, code, review, test, etc.",
        "Leverage persistent memory — the AI remembers your preferences",
        "Review AI suggestions — trust but verify",
      ]},
      { type: "heading", text: "Conclusion" },
      { type: "paragraph", text: "AI coding assistants are no longer experimental — they're essential tools for modern development. Aurict's multi-agent approach and 218+ contextual skills make it a powerful choice for any developer." },
    ],
  },
  {
    slug: "claude-code-vs-aurict",
    title: "Claude Code vs Aurict: Which Terminal AI is Right for You?",
    description: "A detailed comparison of Claude Code and Aurict. We cover provider support, agent architecture, pricing, and which tool fits different workflows.",
    date: "2026-06-12",
    readTime: "10 min read",
    category: "Comparison",
    content: [
      { type: "heading", text: "Overview" },
      { type: "paragraph", text: "Claude Code and Aurict are both terminal-based AI coding assistants, but they take very different approaches. This comparison will help you choose the right tool for your workflow." },
      { type: "heading", text: "Provider Support" },
      { type: "paragraph", text: "Claude Code is tied to Anthropic's Claude models only. Aurict supports 9 providers:" },
      { type: "list", items: [
        "Anthropic (Claude 4 Opus, Sonnet, Haiku)",
        "OpenAI (GPT-4o, o1, o3)",
        "Google (Gemini 2.0, 1.5 Pro)",
        "OpenRouter (200+ models)",
        "xAI (Grok 3)",
        "Azure OpenAI",
        "AWS Bedrock",
        "Ollama (local models)",
        "OpenCode",
      ]},
      { type: "heading", text: "Architecture" },
      { type: "paragraph", text: "Claude Code uses a single model for all tasks. Aurict employs 9 specialist agents (Explore, Code, Review, Test, Docs, Security, Debug, Performance, Analytics) that can work in parallel." },
      { type: "heading", text: "Pricing" },
      { type: "paragraph", text: "Both tools are open source and free. You bring your own API keys. Claude Code requires an Anthropic subscription or API key. Aurict works with any provider." },
      { type: "heading", text: "Which Should You Choose?" },
      { type: "paragraph", text: "Choose Claude Code if: You're heavily invested in the Anthropic ecosystem and want tight Claude integration." },
      { type: "paragraph", text: "Choose Aurict if: You want provider flexibility, multi-agent orchestration, and 218+ contextual skills." },
    ],
  },
  {
    slug: "terminal-ai-tools-2026",
    title: "The Best Terminal AI Tools in 2026",
    description: "An overview of the terminal AI landscape in 2026. Compare Aurict, Claude Code, Aider, OpenCode, and other tools to find the right fit for your workflow.",
    date: "2026-06-10",
    readTime: "12 min read",
    category: "Overview",
    content: [
      { type: "heading", text: "The Terminal AI Renaissance" },
      { type: "paragraph", text: "2026 has seen explosive growth in terminal-based AI coding tools. Developers are moving away from IDE-bound assistants toward more flexible, powerful terminal tools." },
      { type: "heading", text: "Top Contenders" },
      { type: "paragraph", text: "Here are the leading terminal AI tools in 2026:" },
      { type: "list", items: [
        "Aurict — Multi-agent, 9 providers, 218+ skills",
        "Claude Code — Anthropic's official terminal tool",
        "Aider — Git-focused AI pair programming",
        "OpenCode — Open source terminal AI",
        "GitHub Copilot CLI — Command-line suggestions",
      ]},
      { type: "heading", text: "Key Differentiators" },
      { type: "paragraph", text: "What sets these tools apart?" },
      { type: "list", items: [
        "Multi-agent vs single-model architecture",
        "Provider flexibility and lock-in",
        "Context awareness and codebase understanding",
        "Platform support (native binaries vs runtime dependencies)",
        "Extensibility (custom tools, skills, MCP)",
      ]},
      { type: "heading", text: "Conclusion" },
      { type: "paragraph", text: "The terminal AI space is maturing rapidly. Aurict's multi-agent approach and broad provider support make it a strong choice for developers who want flexibility and power." },
    ],
  },
  {
    slug: "multi-agent-ai-coding",
    title: "Why Multi-Agent AI is the Future of Coding",
    description: "Explore how multi-agent architecture is revolutionizing AI coding assistants. Learn why specialist agents outperform single-model approaches for complex tasks.",
    date: "2026-06-08",
    readTime: "7 min read",
    category: "Architecture",
    content: [
      { type: "heading", text: "The Problem with Single-Model AI" },
      { type: "paragraph", text: "Most AI coding tools use a single model for all tasks. This works for simple requests but falls short for complex, multi-step development work." },
      { type: "heading", text: "The Multi-Agent Solution" },
      { type: "paragraph", text: "Multi-agent systems use specialist agents, each optimized for specific tasks. Aurict ships with 9 specialist agents:" },
      { type: "list", items: [
        "Explore — Codebase analysis and navigation",
        "Code — Implementation and refactoring",
        "Review — Code review and best practices",
        "Test — Test generation and coverage",
        "Docs — Documentation generation",
        "Security — Vulnerability scanning",
        "Debug — Root cause analysis",
        "Performance — Profiling and optimization",
        "Analytics — Data analysis and insights",
      ]},
      { type: "heading", text: "Parallel Execution" },
      { type: "paragraph", text: "Multi-agent systems can decompose complex tasks and run agents in parallel. What takes a single model 10 minutes might take 2 minutes with 5 specialized agents working together." },
      { type: "heading", text: "Context Specialization" },
      { type: "paragraph", text: "Each agent has its own context budget and domain knowledge. The security agent doesn't waste tokens on code generation — it focuses entirely on finding vulnerabilities." },
    ],
  },
  {
    slug: "mcp-model-context-protocol",
    title: "What is MCP (Model Context Protocol) and Why It Matters",
    description: "A comprehensive guide to the Model Context Protocol. Learn how MCP enables AI assistants to connect with your existing tools and extend their capabilities.",
    date: "2026-06-05",
    readTime: "9 min read",
    category: "Technical",
    content: [
      { type: "heading", text: "Introduction to MCP" },
      { type: "paragraph", text: "The Model Context Protocol (MCP) is an open standard that enables AI assistants to connect with external tools and data sources. It's like a universal adapter for AI." },
      { type: "heading", text: "How MCP Works" },
      { type: "paragraph", text: "MCP defines a standard interface for AI models to interact with external systems. Instead of building custom integrations for each tool, AI assistants can use MCP to connect to any compatible service." },
      { type: "heading", text: "Common MCP Use Cases" },
      { type: "list", items: [
        "Database queries — Ask your AI to query PostgreSQL directly",
        "File system access — Read and write files with proper permissions",
        "API integration — Connect to GitHub, Slack, Jira, and more",
        "Browser automation — Control a browser for testing and scraping",
      ]},
      { type: "heading", text: "Aurict's MCP Support" },
      { type: "paragraph", text: "Aurict reads your claude_desktop_config.json automatically. Any MCP server you've configured for Claude Desktop works immediately with Aurict." },
      { type: "code", language: "json", text: "{\n  \"mcpServers\": {\n    \"postgres\": {\n      \"command\": \"npx\",\n      \"args\": [\"-y\", \"@modelcontextprotocol/server-postgres\"],\n      \"env\": {\n        \"DATABASE_URL\": \"postgresql://localhost:5432/mydb\"\n      }\n    }\n  }\n}" },
      { type: "heading", text: "The Future of AI Integration" },
      { type: "paragraph", text: "MCP is becoming the standard for AI tool integration. As more tools adopt MCP, AI assistants like Aurict become more powerful without requiring custom code for each integration." },
    ],
  },
]

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = POSTS.find((p) => p.slug === slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `https://aurict.dev/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://aurict.dev/blog/${slug}`,
      type: "article",
      publishedTime: post.date,
      authors: ["Aurict"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = POSTS.find((p) => p.slug === slug)

  if (!post) notFound()

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.description,
    "datePublished": post.date,
    "author": { "@type": "Organization", "name": "Aurict" },
    "publisher": { "@type": "Organization", "name": "Aurict", "url": "https://aurict.dev" },
    "url": `https://aurict.dev/blog/${slug}`,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <Nav />
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "100px 24px 80px" }}>
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: post.title, href: `/blog/${slug}` },
          ]}
        />

        <article>
          {/* Header */}
          <header style={{ marginBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-geist-mono)",
                  color: "var(--accent)",
                  background: "var(--accent-glow)",
                  border: "1px solid rgba(129,140,248,0.3)",
                  borderRadius: 4,
                  padding: "3px 8px",
                  letterSpacing: "0.04em",
                }}
              >
                {post.category}
              </span>
              <span style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-geist-mono)" }}>
                {post.date} · {post.readTime}
              </span>
            </div>
            <h1
              style={{
                fontSize: "clamp(28px, 4vw, 40px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "var(--text)",
                lineHeight: 1.2,
                marginBottom: 16,
              }}
            >
              {post.title}
            </h1>
            <p style={{ fontSize: 17, color: "var(--text-dim)", lineHeight: 1.7 }}>
              {post.description}
            </p>
          </header>

          {/* Content */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {post.content.map((block, i) => {
              switch (block.type) {
                case "heading":
                  return (
                    <h2
                      key={i}
                      style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: "var(--text)",
                        letterSpacing: "-0.02em",
                        marginTop: 16,
                      }}
                    >
                      {block.text}
                    </h2>
                  )
                case "paragraph":
                  return (
                    <p
                      key={i}
                      style={{
                        fontSize: 15,
                        color: "var(--text-dim)",
                        lineHeight: 1.8,
                      }}
                    >
                      {block.text}
                    </p>
                  )
                case "code":
                  return <CodeBlock key={i} code={block.text!} language={block.language} />
                case "list":
                  return (
                    <ul
                      key={i}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        paddingLeft: 20,
                        fontSize: 15,
                        color: "var(--text-dim)",
                        lineHeight: 1.7,
                      }}
                    >
                      {block.items?.map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  )
                default:
                  return null
              }
            })}
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: 64,
              paddingTop: 32,
              borderTop: "1px solid var(--border)",
            }}
          >
            <Link
              href="/blog"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
                color: "var(--accent)",
                textDecoration: "none",
              }}
            >
              ← Back to Blog
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}

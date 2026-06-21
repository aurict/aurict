"use client"
import { Nav } from "@/components/Nav"
import { Footer } from "@/components/sections/Footer"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import Link from "next/link"

interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  readTime: string
  category: string
}

const POSTS: BlogPost[] = [
  {
    slug: "how-to-use-ai-coding-assistant",
    title: "How to Use an AI Coding Assistant in 2026",
    description: "A practical guide to getting started with AI coding assistants. Learn best practices, common pitfalls, and how to maximize productivity with terminal-based AI tools.",
    date: "2026-06-15",
    readTime: "8 min read",
    category: "Tutorial",
  },
  {
    slug: "claude-code-vs-aurict",
    title: "Claude Code vs Aurict: Which Terminal AI is Right for You?",
    description: "A detailed comparison of Claude Code and Aurict. We cover provider support, agent architecture, pricing, and which tool fits different workflows.",
    date: "2026-06-12",
    readTime: "10 min read",
    category: "Comparison",
  },
  {
    slug: "terminal-ai-tools-2026",
    title: "The Best Terminal AI Tools in 2026",
    description: "An overview of the terminal AI landscape in 2026. Compare Aurict, Claude Code, Aider, OpenCode, and other tools to find the right fit for your workflow.",
    date: "2026-06-10",
    readTime: "12 min read",
    category: "Overview",
  },
  {
    slug: "multi-agent-ai-coding",
    title: "Why Multi-Agent AI is the Future of Coding",
    description: "Explore how multi-agent architecture is revolutionizing AI coding assistants. Learn why specialist agents outperform single-model approaches for complex tasks.",
    date: "2026-06-08",
    readTime: "7 min read",
    category: "Architecture",
  },
  {
    slug: "mcp-model-context-protocol",
    title: "What is MCP (Model Context Protocol) and Why It Matters",
    description: "A comprehensive guide to the Model Context Protocol. Learn how MCP enables AI assistants to connect with your existing tools and extend their capabilities.",
    date: "2026-06-05",
    readTime: "9 min read",
    category: "Technical",
  },
]

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://aurict.com" },
    { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://aurict.com/blog" },
  ],
}

const blogJsonLd = {
  "@context": "https://schema.org",
  "@type": "Blog",
  "name": "Aurict Blog",
  "description": "AI coding insights, tutorials, and comparisons",
  "url": "https://aurict.com/blog",
  "publisher": { "@type": "Organization", "name": "Aurict", "url": "https://aurict.com" },
}

export default function BlogPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />
      <Nav />
      <main style={{ maxWidth: 780, margin: "0 auto", padding: "100px 24px 80px" }}>
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Blog", href: "/blog" },
          ]}
        />

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
            Blog
          </p>
          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--text)",
              marginBottom: 16,
            }}
          >
            AI Coding Insights
          </h1>
          <p style={{ fontSize: 16, color: "var(--text-dim)", lineHeight: 1.7, maxWidth: 580 }}>
            Tutorials, comparisons, and deep dives into AI-powered development tools.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              style={{
                display: "block",
                padding: "28px 32px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                textDecoration: "none",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--border-bright)"
                e.currentTarget.style.transform = "translateY(-2px)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)"
                e.currentTarget.style.transform = "translateY(0)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
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
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-geist-mono)",
                  }}
                >
                  {post.date} · {post.readTime}
                </span>
              </div>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--text)",
                  marginBottom: 8,
                  letterSpacing: "-0.02em",
                }}
              >
                {post.title}
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-dim)",
                  lineHeight: 1.6,
                }}
              >
                {post.description}
              </p>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}

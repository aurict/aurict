"use client"
import { Nav } from "@/components/Nav"
import { Footer } from "@/components/sections/Footer"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import Link from "next/link"

interface UseCaseItem {
  slug: string
  title: string
  description: string
  agent: string
  icon: string
}

const USE_CASES: UseCaseItem[] = [
  {
    slug: "refactoring",
    title: "Code Refactoring",
    description: "Refactor complex code safely with dependency analysis and automatic test verification.",
    agent: "Code Agent",
    icon: "🔄",
  },
  {
    slug: "code-review",
    title: "Code Review",
    description: "Catch bugs, security issues, and style violations before they reach production.",
    agent: "Review Agent",
    icon: "🔍",
  },
  {
    slug: "testing",
    title: "Test Generation",
    description: "Generate comprehensive test suites with edge case coverage automatically.",
    agent: "Test Agent",
    icon: "🧪",
  },
  {
    slug: "documentation",
    title: "Documentation",
    description: "Auto-generate READMEs, API docs, and inline comments from your code.",
    agent: "Docs Agent",
    icon: "📝",
  },
]

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://aurict.dev" },
    { "@type": "ListItem", "position": 2, "name": "Use Cases", "item": "https://aurict.dev/use-cases" },
  ],
}

export default function UseCasesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Nav />
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "100px 24px 80px" }}>
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Use Cases", href: "/use-cases" },
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
            Use Cases
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
            What Can Aurict Do?
          </h1>
          <p style={{ fontSize: 16, color: "var(--text-dim)", lineHeight: 1.7, maxWidth: 580 }}>
            See how Aurict's specialist agents handle real-world development tasks.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {USE_CASES.map((uc) => (
            <Link
              key={uc.slug}
              href={`/use-cases/${uc.slug}`}
              style={{
                display: "block",
                padding: "28px 28px",
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
              <div style={{ fontSize: 32, marginBottom: 16 }}>{uc.icon}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--text)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {uc.title}
                </h2>
              </div>
              <span
                style={{
                  display: "inline-block",
                  fontSize: 11,
                  fontFamily: "var(--font-geist-mono)",
                  color: "var(--accent)",
                  background: "var(--accent-glow)",
                  border: "1px solid rgba(129,140,248,0.3)",
                  borderRadius: 4,
                  padding: "2px 6px",
                  marginBottom: 12,
                }}
              >
                {uc.agent}
              </span>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-dim)",
                  lineHeight: 1.6,
                }}
              >
                {uc.description}
              </p>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}

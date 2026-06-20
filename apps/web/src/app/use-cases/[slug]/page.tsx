import { Nav } from "@/components/Nav"
import { Footer } from "@/components/sections/Footer"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { CodeBlock } from "@/components/ui/CodeBlock"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

interface UseCase {
  slug: string
  title: string
  description: string
  agent: string
  problem: string
  solution: string
  steps: string[]
  benefits: string[]
  beforeCode?: string
  afterCode?: string
}

const USE_CASES: UseCase[] = [
  {
    slug: "refactoring",
    title: "AI-Powered Code Refactoring",
    description: "Refactor complex code safely with Aurict's code agent. Identify issues, plan changes, and execute refactoring with confidence.",
    agent: "Code Agent",
    problem: "Legacy code is hard to refactor. You need to understand dependencies, avoid breaking changes, and ensure tests still pass. Manual refactoring is slow and error-prone.",
    solution: "Aurict's Code Agent analyzes your codebase, identifies refactoring opportunities, and executes changes safely. It uses the Explore Agent to map dependencies first, then makes targeted changes with full context awareness.",
    steps: [
      "Ask Aurict to refactor a specific module or pattern",
      "The Explore Agent maps all dependencies and usages",
      "The Code Agent plans the refactoring approach",
      "Changes are made with full context awareness",
      "Tests are run automatically to verify correctness",
    ],
    benefits: [
      "Dependency-aware refactoring — no broken imports",
      "Automatic test verification",
      "Handles complex multi-file changes",
      "Preserves code style and conventions",
      "Works with any language or framework",
    ],
    beforeCode: `// Before: Scattered auth logic
function login(user, pass) {
  const token = btoa(user + ":" + pass)
  localStorage.setItem("token", token)
  return fetch("/api/login", {
    headers: { Authorization: "Basic " + token }
  })
}

function getUser() {
  const token = localStorage.getItem("token")
  return fetch("/api/user", {
    headers: { Authorization: "Basic " + token }
  })
}`,
    afterCode: `// After: Clean auth module with JWT
import { createAuthModule } from "./auth"

const auth = createAuthModule({
  storage: "secure",  // httpOnly cookie
  tokenType: "jwt",
  expiry: "24h",
})

// Single source of truth
async function login(credentials) {
  return auth.authenticate(credentials)
}

// Automatic token refresh
async function getUser() {
  return auth.getUser()
}`,
  },
  {
    slug: "code-review",
    title: "Automated Code Review with AI",
    description: "Catch bugs, security issues, and style violations before they reach production. Aurict's Review Agent provides thorough code review.",
    agent: "Review Agent",
    problem: "Code reviews are time-consuming. Reviewers miss subtle bugs, security issues, and style inconsistencies. Manual review doesn't scale with team size.",
    solution: "Aurict's Review Agent analyzes code changes for bugs, security vulnerabilities, performance issues, and style violations. It provides actionable feedback with specific line references.",
    steps: [
      "Point Aurict at a PR, branch, or file",
      "The Review Agent analyzes the code changes",
      "Issues are categorized by severity",
      "Suggestions include code examples",
      "Security vulnerabilities are flagged immediately",
    ],
    benefits: [
      "Catches bugs humans miss",
      "Security vulnerability detection",
      "Consistent style enforcement",
      "Performance issue identification",
      "Scales to any codebase size",
    ],
  },
  {
    slug: "testing",
    title: "AI-Generated Tests That Work",
    description: "Generate meaningful tests with Aurict's Test Agent. Achieve high coverage with tests that actually catch bugs.",
    agent: "Test Agent",
    problem: "Writing tests is tedious. Developers skip tests under deadline pressure. Low coverage leads to bugs reaching production. Writing good tests requires experience.",
    solution: "Aurict's Test Agent analyzes your code and generates comprehensive test suites. It creates unit tests, integration tests, and edge case coverage automatically.",
    steps: [
      "Ask Aurict to generate tests for a module",
      "The Test Agent analyzes the code structure",
      "Test cases are generated for all paths",
      "Edge cases and error scenarios are included",
      "Tests are written in your project's test framework",
    ],
    benefits: [
      "High test coverage automatically",
      "Edge case identification",
      "Framework-aware (Jest, Vitest, etc.)",
      "Meaningful test names and structure",
      "Mock generation for dependencies",
    ],
  },
  {
    slug: "documentation",
    title: "Auto-Generate Documentation",
    description: "Generate comprehensive documentation from your code. Aurict's Docs Agent creates READMEs, API docs, and inline comments.",
    agent: "Docs Agent",
    problem: "Documentation is always outdated. Developers hate writing docs. New team members struggle to understand the codebase. API documentation is incomplete.",
    solution: "Aurict's Docs Agent analyzes your code and generates accurate, up-to-date documentation. It creates README files, API documentation, inline comments, and usage examples.",
    steps: [
      "Ask Aurict to document a module or the whole project",
      "The Docs Agent analyzes code structure and types",
      "Documentation is generated with examples",
      "API endpoints are documented automatically",
      "README files are created or updated",
    ],
    benefits: [
      "Always up-to-date documentation",
      "API documentation from types",
      "Usage examples included",
      "README generation",
      "Inline comment generation",
    ],
  },
]

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const uc = USE_CASES.find((u) => u.slug === slug)
  if (!uc) return {}

  return {
    title: uc.title,
    description: uc.description,
    alternates: { canonical: `https://aurict.dev/use-cases/${slug}` },
    openGraph: {
      title: uc.title,
      description: uc.description,
      url: `https://aurict.dev/use-cases/${slug}`,
    },
  }
}

export default async function UseCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const uc = USE_CASES.find((u) => u.slug === slug)

  if (!uc) notFound()

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": uc.title,
    "description": uc.description,
    "step": uc.steps.map((step, i) => ({
      "@type": "HowToStep",
      "position": i + 1,
      "name": `Step ${i + 1}`,
      "text": step,
    })),
  }

  const otherUseCases = USE_CASES.filter((u) => u.slug !== slug)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <Nav />
      <main style={{ maxWidth: 780, margin: "0 auto", padding: "100px 24px 80px" }}>
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Use Cases", href: "/use-cases" },
            { label: uc.title, href: `/use-cases/${slug}` },
          ]}
        />

        {/* Hero */}
        <div style={{ marginBottom: 56 }}>
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
              }}
            >
              {uc.agent}
            </span>
          </div>
          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--text)",
              marginBottom: 16,
            }}
          >
            {uc.title}
          </h1>
          <p style={{ fontSize: 16, color: "var(--text-dim)", lineHeight: 1.7, maxWidth: 600 }}>
            {uc.description}
          </p>
        </div>

        {/* Problem */}
        <section style={{ marginBottom: 48 }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ color: "var(--error)" }}>✕</span>
            The Problem
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-dim)", lineHeight: 1.8 }}>
            {uc.problem}
          </p>
        </section>

        {/* Solution */}
        <section style={{ marginBottom: 48 }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ color: "var(--success)" }}>✓</span>
            How Aurict Solves It
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-dim)", lineHeight: 1.8 }}>
            {uc.solution}
          </p>
        </section>

        {/* Steps */}
        <section style={{ marginBottom: 48 }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 20,
            }}
          >
            How It Works
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {uc.steps.map((step, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                  padding: "14px 18px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: 12,
                    color: "var(--accent)",
                    width: 24,
                    flexShrink: 0,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.5 }}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Code Example */}
        {uc.beforeCode && uc.afterCode && (
          <section style={{ marginBottom: 48 }}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: 20,
              }}
            >
              Before & After
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, fontFamily: "var(--font-geist-mono)" }}>
                  BEFORE
                </p>
                <CodeBlock code={uc.beforeCode} language="typescript" />
              </div>
              <div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, fontFamily: "var(--font-geist-mono)" }}>
                  AFTER
                </p>
                <CodeBlock code={uc.afterCode} language="typescript" />
              </div>
            </div>
          </section>
        )}

        {/* Benefits */}
        <section style={{ marginBottom: 56 }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 20,
            }}
          >
            Benefits
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
            }}
          >
            {uc.benefits.map((benefit) => (
              <div
                key={benefit}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 16px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              >
                <span style={{ color: "var(--success)", fontSize: 14 }}>✓</span>
                <span style={{ fontSize: 13, color: "var(--text-dim)" }}>{benefit}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section
          style={{
            textAlign: "center",
            padding: "48px 32px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            marginBottom: 56,
          }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>
            Try it yourself
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-dim)", marginBottom: 24 }}>
            Install Aurict and see the {uc.agent.toLowerCase()} in action.
          </p>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              fontFamily: "var(--font-geist-mono)",
              fontSize: 14,
              color: "var(--text)",
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "12px 20px",
            }}
          >
            <span style={{ color: "var(--accent)" }}>$</span>
            <span>npm install -g aurict</span>
          </div>
        </section>

        {/* Other Use Cases */}
        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>
            Other Use Cases
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {otherUseCases.map((u) => (
              <Link
                key={u.slug}
                href={`/use-cases/${u.slug}`}
                style={{
                  fontSize: 13,
                  color: "var(--text-dim)",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "6px 12px",
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-bright)"
                  e.currentTarget.style.color = "var(--text)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)"
                  e.currentTarget.style.color = "var(--text-dim)"
                }}
              >
                {u.title}
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

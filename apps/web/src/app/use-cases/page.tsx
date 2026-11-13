import { getLocale } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { Nav } from "@/components/Nav"
import { Footer } from "@/components/sections/Footer"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { USE_CASES } from "@/content/use-cases"
import { localizeUseCase } from "@/content/use-case-translations"
import type { AppLocale } from "@/i18n/routing"
import { breadcrumbJsonLd, collectionJsonLd } from "@/lib/seo"

const breadcrumb = breadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Use Cases", path: "/use-cases" },
])

const collection = collectionJsonLd({
  name: "Aurict Use Cases",
  description: "Practical AI-powered development workflows for terminal-native coding.",
  path: "/use-cases",
  items: USE_CASES.map((useCase) => ({
    name: useCase.title,
    path: `/use-cases/${useCase.slug}`,
    description: useCase.description,
  })),
})

export default async function UseCasesPage() {
  const locale = await getLocale() as AppLocale
  const tr = locale === "tr"
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collection).replace(/</g, "\\u003c") }} />
      <Nav />
      <main className="marketing-main" style={{ maxWidth: 900 }}>
        <Breadcrumb
          items={[
            { label: tr ? "Ana sayfa" : "Home", href: "/" },
            { label: tr ? "Kullanım alanları" : "Use Cases", href: "/use-cases" },
          ]}
        />

        <div className="marketing-hero">
          <p className="marketing-eyebrow">{tr ? "Kullanım alanları" : "Use cases"}</p>
          <h1 className="marketing-title marketing-title-sm">{tr ? "Aurict neler yapabilir?" : "What can Aurict do?"}</h1>
          <p className="marketing-lede" style={{ maxWidth: 620 }}>
            {tr ? "Aurict'in uzman ajanlarının gerçek dünya geliştirme görevlerini terminal odaklı bir iş akışında nasıl ele aldığını görün." : "See how Aurict&apos;s specialist agents handle real-world development tasks in a terminal-native workflow."}
          </p>
        </div>

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          {USE_CASES.map((sourceUseCase) => {
            const useCase = localizeUseCase(sourceUseCase, locale)
            return (
            <Link
              key={useCase.slug}
              href={`/use-cases/${useCase.slug}`}
              className="marketing-card"
              style={{ display: "block", padding: "28px", textDecoration: "none" }}
            >
              <div className="mono" style={{ color: "var(--accent)", fontSize: 12, marginBottom: 16 }}>{useCase.icon}</div>
              <h2 style={{ color: "var(--text)", fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 8 }}>
                {useCase.title}
              </h2>
              <span className="marketing-tag" style={{ marginBottom: 12 }}>{useCase.agent}</span>
              <p style={{ color: "var(--text-dim)", fontSize: 14, lineHeight: 1.6, marginTop: 12 }}>
                {useCase.description}
              </p>
            </Link>
            )
          })}
        </div>
      </main>
      <Footer />
    </>
  )
}

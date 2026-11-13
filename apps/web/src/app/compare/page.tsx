import type { Metadata } from "next"
import { getLocale } from "next-intl/server"
import { localizeComparison } from "@/content/comparison-translations"
import type { AppLocale } from "@/i18n/routing"
import { Nav } from "@/components/Nav"
import { Footer } from "@/components/sections/Footer"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { CompareCard } from "@/components/ui/CompareCard"
import { COMPARISONS } from "@/content/comparisons"
import { breadcrumbJsonLd, collectionJsonLd } from "@/lib/seo"
import { localizedMetadata } from "@/i18n/metadata"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale() as AppLocale
  const title = locale === "tr"
    ? "Aurict ve Alternatifleri — Terminal Yapay Zekâ Ajanı Karşılaştırmaları"
    : "Aurict vs. Alternatives — Terminal AI Agent Comparisons"
  const description = locale === "tr"
    ? "Aurict'i Claude Code, Cursor, Aider, GitHub Copilot ve OpenCode ile sağlayıcı desteği, izinler, ajan mimarisi ve doğrulama açısından karşılaştırın."
    : "Compare Aurict with Claude Code, Cursor, Aider, GitHub Copilot, and OpenCode across providers, permissions, agent architecture, and verification."

  return localizedMetadata(locale, "/compare", title, description, {
    keywords: ["terminal agent comparison", "AI coding agent comparison", "Aurict alternatives"],
  })
}

const breadcrumb = breadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Compare", path: "/compare" },
])

const collection = collectionJsonLd({
  name: "Aurict Alternatives and Comparisons",
  description: "Compare Aurict with Claude Code, Cursor, Aider, GitHub Copilot, and OpenCode.",
  path: "/compare",
  items: COMPARISONS.map((comparison) => ({
    name: comparison.title,
    path: `/compare/${comparison.slug}`,
    description: comparison.description,
  })),
})

export default async function ComparePage() {
  const locale = await getLocale() as AppLocale
  const tr = locale === "tr"
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collection).replace(/</g, "\\u003c") }} />
      <Nav />
      <main className="marketing-main" style={{ maxWidth: 900 }}>
        <Breadcrumb items={[{ label: tr ? "Ana sayfa" : "Home", href: "/" }, { label: tr ? "Karşılaştır" : "Compare", href: "/compare" }]} />

        <div className="marketing-hero" style={{ marginTop: 24 }}>
          <p className="marketing-eyebrow">{tr ? "Karşılaştırmalar" : "Comparisons"}</p>
          <h1 className="marketing-title marketing-title-sm">{tr ? "Aurict ve alternatifleri" : "Aurict vs. the alternatives"}</h1>
          <p className="marketing-lede">
            {tr ? "Aurict diğer yapay zekâ kodlama araçlarıyla nasıl karşılaştırılıyor? Nerede öne çıktığına, rakiplerin güçlü olduğu alanlara ve hangi aracın hangi iş akışına uyduğuna dürüstçe bakın." : "How does Aurict compare to other AI coding tools? Here&apos;s an honest look at where it wins, where competitors have their strengths, and which tool fits which workflow."}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {COMPARISONS.map((comparison) => <CompareCard key={comparison.slug} {...localizeComparison(comparison, locale)} />)}
        </div>
      </main>
      <Footer />
    </>
  )
}

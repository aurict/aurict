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
import { localizeEnglish } from "@/i18n/content"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale() as AppLocale
  const t = (source: string) => localizeEnglish(locale, source)
  const title = locale === "tr"
    ? "Aurict Alternatifleri — Terminal Ajanı Karşılaştırmaları"
    : t("Aurict vs. Alternatives — Terminal AI Agent Comparisons")
  const description = locale === "tr"
    ? "Aurict'i Claude Code, Cursor, Aider, GitHub Copilot ve OpenCode ile sağlayıcı desteği, izinler, ajan mimarisi ve doğrulama açısından karşılaştırın."
    : t("Compare Aurict with Claude Code, Cursor, Aider, GitHub Copilot, and OpenCode across providers, permissions, agent architecture, and verification.")

  return localizedMetadata(locale, "/compare", title, description, {
    keywords: ["terminal agent comparison", "AI coding agent comparison", "Aurict alternatives"],
  })
}

export default async function ComparePage() {
  const locale = await getLocale() as AppLocale
  const tr = locale === "tr"
  const t = (source: string) => localizeEnglish(locale, source)
  const contentLocale = locale
  const comparisons = COMPARISONS.map((comparison) => localizeComparison(comparison, locale))
  const breadcrumb = breadcrumbJsonLd([
    { name: tr ? "Ana sayfa" : t("Home"), path: "/" },
    { name: tr ? "Karşılaştırmalar" : t("Compare"), path: "/compare" },
  ], contentLocale)
  const collection = collectionJsonLd({
    name: tr ? "Aurict Alternatifleri ve Karşılaştırmaları" : t("Aurict Alternatives and Comparisons"),
    description: tr
      ? "Aurict'i Claude Code, Cursor, Aider, GitHub Copilot ve OpenCode ile karşılaştırın."
      : t("Compare Aurict with Claude Code, Cursor, Aider, GitHub Copilot, and OpenCode."),
    path: "/compare",
    locale: contentLocale,
    items: comparisons.map((comparison) => ({
      name: comparison.title,
      path: `/compare/${comparison.slug}`,
      description: comparison.description,
    })),
  })
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collection) }} />
      <Nav />
      <main className="marketing-main" style={{ maxWidth: 900 }}>
        <Breadcrumb items={[{ label: tr ? "Ana sayfa" : t("Home"), href: "/" }, { label: tr ? "Karşılaştır" : t("Compare"), href: "/compare" }]} />

        <div className="marketing-hero" style={{ marginTop: 24 }}>
          <p className="marketing-eyebrow">{tr ? "Karşılaştırmalar" : t("Comparisons")}</p>
          <h1 className="marketing-title marketing-title-sm">{tr ? "Aurict ve alternatifleri" : t("Aurict vs. the alternatives")}</h1>
          <p className="marketing-lede">
            {tr ? "Aurict diğer yapay zekâ kodlama araçlarıyla nasıl karşılaştırılıyor? Nerede öne çıktığına, rakiplerin güçlü olduğu alanlara ve hangi aracın hangi iş akışına uyduğuna dürüstçe bakın." : t("How does Aurict compare to other AI coding tools? Here is an honest look at where it wins, where competitors have strengths, and which tool fits each workflow.")}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {comparisons.map((comparison) => <CompareCard key={comparison.slug} {...comparison} />)}
        </div>
      </main>
      <Footer />
    </>
  )
}

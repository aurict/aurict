import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getLocale } from "next-intl/server"
import { Nav } from "@/components/Nav"
import { Footer } from "@/components/sections/Footer"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { localizeComparison } from "@/content/comparison-translations"
import { COMPARISONS } from "@/content/comparisons"
import type { AppLocale } from "@/i18n/routing"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const comparison = COMPARISONS.find((entry) => entry.slug === slug)
  if (!comparison) return {}

  return {
    title: comparison.title,
    description: comparison.description,
    alternates: { canonical: `https://aurict.com/compare/${slug}` },
    openGraph: { title: comparison.title, description: comparison.description, url: `https://aurict.com/compare/${slug}` },
  }
}

export function generateStaticParams() {
  return COMPARISONS.map((comparison) => ({ slug: comparison.slug }))
}

export default async function ComparePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const locale = await getLocale() as AppLocale
  const source = COMPARISONS.find((comparison) => comparison.slug === slug)
  if (!source) notFound()

  const comparison = localizeComparison(source, locale)
  const others = COMPARISONS.filter((entry) => entry.slug !== slug).map((entry) => localizeComparison(entry, locale))
  const tr = locale === "tr"
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: comparison.title,
    description: comparison.description,
    dateModified: comparison.updatedAt,
    url: `https://aurict.com/compare/${slug}`,
    author: { "@type": "Organization", name: "Aurict" },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <Nav />
      <main className="marketing-main" style={{ maxWidth: 860 }}>
        <Breadcrumb items={[{ label: tr ? "Ana sayfa" : "Home", href: "/" }, { label: `vs ${comparison.competitor}`, href: `/compare/${slug}` }]} />
        <div className="marketing-hero">
          <p className="marketing-eyebrow">{tr ? "Karşılaştırma" : "Comparison"}</p>
          <h1 className="marketing-title marketing-title-sm">Aurict vs {comparison.competitor}</h1>
          <p className="marketing-lede">{comparison.description}</p>
          <p className="mono" style={{ fontSize: 13, color: "var(--accent)", marginTop: 18 }}>{comparison.tagline}</p>
        </div>

        <section style={{ marginBottom: 56 }}>
          <h2 className="marketing-section-title">{tr ? "Belgelenmiş iş akışları" : "Documented workflows"}</h2>
          <div className="marketing-card" style={{ overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, .9fr) minmax(0, .9fr)", gap: 16, padding: "12px 20px", background: "var(--bg-alt)", borderBottom: "1px solid var(--border)", font: "12px var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              <span>{tr ? "Konu" : "Area"}</span><span style={{ color: "var(--accent)" }}>Aurict</span><span>{comparison.competitor}</span>
            </div>
            {comparison.rows.map((row, index) => (
              <div key={row.name} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, .9fr) minmax(0, .9fr)", gap: 16, padding: "15px 20px", borderBottom: index < comparison.rows.length - 1 ? "1px solid var(--border)" : "none", font: "15px/1.5 var(--font-serif)" }}>
                <span style={{ color: "var(--text)" }}>{row.name}</span><span style={{ color: "var(--text-dim)" }}>{row.aurict}</span><span style={{ color: "var(--text-dim)" }}>{row.competitor}</span>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 56 }}>
          <h2 className="marketing-section-title">{tr ? "Aurict nerede ayrışır?" : "Where Aurict differs"}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {comparison.ourStrengths.map((strength) => <div key={strength} className="marketing-card" style={{ display: "flex", gap: 12, padding: "12px 16px" }}><span style={{ color: "var(--success)", fontSize: 16 }}>✓</span><span style={{ font: "15px/1.5 var(--font-serif)", color: "var(--text-dim)" }}>{strength}</span></div>)}
          </div>
        </section>

        <section className="marketing-card" style={{ padding: "24px 26px", marginBottom: 56 }}>
          <p className="marketing-eyebrow" style={{ marginBottom: 10 }}>{tr ? "Araştırma notu" : "Research note"}</p>
          <p className="marketing-copy" style={{ marginBottom: 12 }}>{tr ? `Rakip bilgileri resmî dokümanlara göre ${comparison.updatedAt} tarihinde gözden geçirildi. Ürünler hızla değiştiği için karar vermeden önce aşağıdaki kaynakları tekrar kontrol edin.` : `Competitor information was reviewed against official documentation on ${comparison.updatedAt}. Products change quickly; verify the sources below before making a decision.`}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {comparison.sources.map((source) => <a key={source.url} className="landing-pill mono" href={source.url} rel="noreferrer" target="_blank">{source.label} ↗</a>)}
          </div>
        </section>

        <section style={{ marginBottom: 56 }}>
          <h2 className="marketing-section-title" style={{ fontSize: 24 }}>{tr ? "Diğer karşılaştırmalar" : "Other comparisons"}</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {others.map((entry) => <Link key={entry.slug} href={`/compare/${entry.slug}`} className="mono landing-pill" style={{ textDecoration: "none" }}>Aurict vs {entry.competitor}</Link>)}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

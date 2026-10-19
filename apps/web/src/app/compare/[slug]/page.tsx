import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getLocale } from "next-intl/server"
import { Nav } from "@/components/Nav"
import { Footer } from "@/components/sections/Footer"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { JsonLd } from "@/components/seo/JsonLd"
import { localizeComparison } from "@/content/comparison-translations"
import { COMPARISONS } from "@/content/comparisons"
import type { AppLocale } from "@/i18n/routing"
import { localizedMetadata, localizedUrl } from "@/i18n/metadata"
import { Link } from "@/i18n/navigation"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const source = COMPARISONS.find((entry) => entry.slug === slug)
  if (!source) return {}
  const locale = await getLocale() as AppLocale
  const comparison = localizeComparison(source, locale)
  const title = locale === "tr"
    ? `${comparison.competitor} Alternatifi — Yapay Zekâ Ajanı Karşılaştırması`
    : `${comparison.competitor} Alternative — Terminal AI Agent Comparison`

  return localizedMetadata(locale, `/compare/${slug}`, title, comparison.description, {
    keywords: [
      `${comparison.competitor} alternative`,
      `${comparison.competitor} alternatives`,
      `Aurict vs ${comparison.competitor}`,
      `${comparison.competitor} comparison`,
      "terminal AI coding agent",
    ],
    type: "article",
    modifiedTime: comparison.updatedAt,
  })
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
  const contentLocale = locale === "tr" ? "tr" : "en"
  const tr = locale === "tr"
  const url = localizedUrl(`/compare/${slug}`, contentLocale)
  const heading = tr
    ? `${comparison.competitor} alternatifi: ${comparison.title}`
    : `${comparison.competitor} alternative: ${comparison.title}`
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article", "@id": `${url}#article`, headline: heading,
        description: comparison.description, dateModified: comparison.updatedAt,
        inLanguage: contentLocale, url, mainEntityOfPage: { "@id": `${url}#webpage` },
        author: { "@id": "https://aurict.com/#organization" },
        publisher: { "@id": "https://aurict.com/#organization" },
      },
      {
        "@type": "WebPage", "@id": `${url}#webpage`, url, name: heading,
        description: comparison.description, inLanguage: contentLocale,
        isPartOf: { "@id": "https://aurict.com/#website" }, mainEntity: { "@id": `${url}#article` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: tr ? "Ana sayfa" : "Home", item: localizedUrl("/", contentLocale) },
          { "@type": "ListItem", position: 2, name: tr ? "Karşılaştırmalar" : "Comparisons", item: localizedUrl("/compare", contentLocale) },
          { "@type": "ListItem", position: 3, name: heading, item: url },
        ],
      },
    ],
  }

  return (
    <>
      <JsonLd data={structuredData} />
      <Nav />
      <main className="marketing-main" style={{ maxWidth: 860 }}>
        <Breadcrumb items={[{ label: tr ? "Ana sayfa" : "Home", href: "/" }, { label: `vs ${comparison.competitor}`, href: `/compare/${slug}` }]} />
        <div className="marketing-hero">
          <p className="marketing-eyebrow">{tr ? "Karşılaştırma" : "Comparison"}</p>
          <h1 className="marketing-title marketing-title-sm">{heading}</h1>
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
              <div key={row.name} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, .9fr) minmax(0, .9fr)", gap: 16, padding: "15px 20px", borderBottom: index < comparison.rows.length - 1 ? "1px solid var(--border)" : "none", font: "15px/1.5 var(--font-sans)" }}>
                <span style={{ color: "var(--text)" }}>{row.name}</span><span style={{ color: "var(--text-dim)" }}>{row.aurict}</span><span style={{ color: "var(--text-dim)" }}>{row.competitor}</span>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 56 }}>
          <h2 className="marketing-section-title">{tr ? `${comparison.competitor} ne zaman daha uygun olabilir?` : `When ${comparison.competitor} may fit better`}</h2>
          <p className="marketing-copy" style={{ marginBottom: 18 }}>
            {tr ? "Alternatif seçimi yalnızca özellik sayısıyla yapılmamalıdır. Aşağıdaki güçlü yönler, resmî ürün dokümanlarına göre bu aracın daha uygun olabileceği iş akışlarını gösterir." : "Choosing an alternative is not a feature-counting exercise. These documented strengths show workflows where the other product may be the better fit."}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {comparison.theirStrengths.map((strength) => <div key={strength} className="marketing-card" style={{ display: "flex", gap: 12, padding: "12px 16px" }}><span style={{ color: "var(--accent-alt)", fontSize: 16 }}>◇</span><span style={{ font: "15px/1.5 var(--font-sans)", color: "var(--text-dim)" }}>{strength}</span></div>)}
          </div>
        </section>

        <section style={{ marginBottom: 56 }}>
          <h2 className="marketing-section-title">{tr ? "Aurict nerede ayrışır?" : "Where Aurict differs"}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {comparison.ourStrengths.map((strength) => <div key={strength} className="marketing-card" style={{ display: "flex", gap: 12, padding: "12px 16px" }}><span style={{ color: "var(--success)", fontSize: 16 }}>✓</span><span style={{ font: "15px/1.5 var(--font-sans)", color: "var(--text-dim)" }}>{strength}</span></div>)}
          </div>
        </section>

        <section className="marketing-card" style={{ padding: "24px 26px", marginBottom: 56 }}>
          <p className="marketing-eyebrow" style={{ marginBottom: 10 }}>{tr ? `${comparison.competitor} alternatifi` : `${comparison.competitor} alternative`}</p>
          <h2 className="marketing-section-title" style={{ fontSize: 25 }}>
            {tr ? `Aurict, ${comparison.competitor} için bir alternatif mi?` : `Is Aurict an alternative to ${comparison.competitor}?`}
          </h2>
          <p className="marketing-copy">
            {tr
              ? `Evet; özellikle terminal tabanlı bir yapay zekâ kodlama ajanında ${comparison.differentiator.toLocaleLowerCase("tr")} arıyorsanız Aurict değerlendirilebilir. Bununla birlikte en doğru seçim, aynı gerçek depo görevini iki araçta çalıştırıp izinleri, diff kalitesini, doğrulama kanıtını, gecikmeyi ve model maliyetini karşılaştırmaktır.`
              : `Yes—especially if you want an AI coding agent centered on ${comparison.differentiator.toLowerCase()}. The reliable way to choose is to run the same representative repository task in both tools and compare permissions, diff quality, verification evidence, latency, and model cost.`}
          </p>
          <Link className="landing-pill mono" href="/ai-coding-agent" style={{ display: "inline-flex", marginTop: 18, textDecoration: "none" }}>{tr ? "kodlama ajanı seçim rehberi" : "AI coding agent buyer guide"} →</Link>
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

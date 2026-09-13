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
import { localizeEnglish } from "@/i18n/content"

const comparisonLabels: Record<AppLocale, {
  metadataTitle(competitor: string): string
  heading(competitor: string, title: string): string
  fit(competitor: string): string
  alternative(competitor: string): string
  question(competitor: string): string
  review(competitor: string, date: string): string
}> = {
  en: {
    metadataTitle: (name) => `${name} Alternative — AI Terminal Agent`, heading: (name, title) => `${name} alternative: ${title}`,
    fit: (name) => `When ${name} may fit better`, alternative: (name) => `${name} alternative`, question: (name) => `Is Aurict an alternative to ${name}?`,
    review: (_name, date) => `Competitor information was reviewed against official documentation on ${date}. Products change quickly; verify the sources below before making a decision.`,
  },
  tr: {
    metadataTitle: (name) => `${name} Alternatifi — Terminal Ajanı`, heading: (name, title) => `${name} alternatifi: ${title}`,
    fit: (name) => `${name} ne zaman daha uygun olabilir?`, alternative: (name) => `${name} alternatifi`, question: (name) => `Aurict, ${name} için bir alternatif mi?`,
    review: (_name, date) => `Rakip bilgileri resmî dokümanlara göre ${date} tarihinde gözden geçirildi. Ürünler hızla değiştiği için karar vermeden önce aşağıdaki kaynakları tekrar kontrol edin.`,
  },
  de: {
    metadataTitle: (name) => `${name}-Alternative — KI-Terminal-Agent`, heading: (name, title) => `${name}-Alternative: ${title}`,
    fit: (name) => `Wann ${name} besser passen kann`, alternative: (name) => `${name}-Alternative`, question: (name) => `Ist Aurict eine Alternative zu ${name}?`,
    review: (_name, date) => `Die Angaben zum Wettbewerber wurden am ${date} anhand offizieller Dokumentation geprüft. Produkte ändern sich schnell; prüfen Sie vor Ihrer Entscheidung die Quellen unten.`,
  },
  fr: {
    metadataTitle: (name) => `Alternative à ${name} — Agent IA terminal`, heading: (name, title) => `Alternative à ${name} : ${title}`,
    fit: (name) => `Quand ${name} peut être plus adapté`, alternative: (name) => `alternative à ${name}`, question: (name) => `Aurict est-il une alternative à ${name} ?`,
    review: (_name, date) => `Les informations sur le concurrent ont été vérifiées dans la documentation officielle le ${date}. Les produits évoluent vite ; consultez les sources avant de décider.`,
  },
  es: {
    metadataTitle: (name) => `Alternativa a ${name} — Agente IA de terminal`, heading: (name, title) => `Alternativa a ${name}: ${title}`,
    fit: (name) => `Cuándo puede encajar mejor ${name}`, alternative: (name) => `alternativa a ${name}`, question: (name) => `¿Es Aurict una alternativa a ${name}?`,
    review: (_name, date) => `La información del competidor se revisó con documentación oficial el ${date}. Los productos cambian rápido; verifica las fuentes antes de decidir.`,
  },
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const source = COMPARISONS.find((entry) => entry.slug === slug)
  if (!source) return {}
  const locale = await getLocale() as AppLocale
  const comparison = localizeComparison(source, locale)
  const title = comparisonLabels[locale].metadataTitle(comparison.competitor)

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
  const tr = locale === "tr"
  const t = (value: string) => localizeEnglish(locale, value)
  const labels = comparisonLabels[locale]
  const url = localizedUrl(`/compare/${slug}`, locale)
  const heading = labels.heading(comparison.competitor, comparison.title)
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article", "@id": `${url}#article`, headline: heading,
        description: comparison.description, dateModified: comparison.updatedAt,
        inLanguage: locale, url, mainEntityOfPage: { "@id": `${url}#webpage` },
        author: { "@id": "https://aurict.com/#organization" },
        publisher: { "@id": "https://aurict.com/#organization" },
      },
      {
        "@type": "WebPage", "@id": `${url}#webpage`, url, name: heading,
        description: comparison.description, inLanguage: locale,
        isPartOf: { "@id": "https://aurict.com/#website" }, mainEntity: { "@id": `${url}#article` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: tr ? "Ana sayfa" : t("Home"), item: localizedUrl("/", locale) },
          { "@type": "ListItem", position: 2, name: tr ? "Karşılaştırmalar" : t("Comparisons"), item: localizedUrl("/compare", locale) },
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
        <Breadcrumb items={[{ label: tr ? "Ana sayfa" : t("Home"), href: "/" }, { label: `vs ${comparison.competitor}`, href: `/compare/${slug}` }]} />
        <div className="marketing-hero">
          <p className="marketing-eyebrow">{tr ? "Karşılaştırma" : t("Comparison")}</p>
          <h1 className="marketing-title marketing-title-sm">{heading}</h1>
          <p className="marketing-lede">{comparison.description}</p>
          <p className="mono" style={{ fontSize: 13, color: "var(--accent)", marginTop: 18 }}>{comparison.tagline}</p>
        </div>

        <section style={{ marginBottom: 56 }}>
          <h2 className="marketing-section-title">{tr ? "Belgelenmiş iş akışları" : t("Documented workflows")}</h2>
          <div className="marketing-card" style={{ overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, .9fr) minmax(0, .9fr)", gap: 16, padding: "12px 20px", background: "var(--bg-alt)", borderBottom: "1px solid var(--border)", font: "12px var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              <span>{tr ? "Konu" : t("Area")}</span><span style={{ color: "var(--accent)" }}>Aurict</span><span>{comparison.competitor}</span>
            </div>
            {comparison.rows.map((row, index) => (
              <div key={row.name} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, .9fr) minmax(0, .9fr)", gap: 16, padding: "15px 20px", borderBottom: index < comparison.rows.length - 1 ? "1px solid var(--border)" : "none", font: "15px/1.5 var(--font-serif)" }}>
                <span style={{ color: "var(--text)" }}>{row.name}</span><span style={{ color: "var(--text-dim)" }}>{row.aurict}</span><span style={{ color: "var(--text-dim)" }}>{row.competitor}</span>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 56 }}>
          <h2 className="marketing-section-title">{labels.fit(comparison.competitor)}</h2>
          <p className="marketing-copy" style={{ marginBottom: 18 }}>
            {tr ? "Alternatif seçimi yalnızca özellik sayısıyla yapılmamalıdır. Aşağıdaki güçlü yönler, resmî ürün dokümanlarına göre bu aracın daha uygun olabileceği iş akışlarını gösterir." : t("Choosing an alternative is not a feature-counting exercise. These documented strengths show workflows where the other product may be the better fit.")}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {comparison.theirStrengths.map((strength) => <div key={strength} className="marketing-card" style={{ display: "flex", gap: 12, padding: "12px 16px" }}><span style={{ color: "var(--accent-alt)", fontSize: 16 }}>◇</span><span style={{ font: "15px/1.5 var(--font-serif)", color: "var(--text-dim)" }}>{strength}</span></div>)}
          </div>
        </section>

        <section style={{ marginBottom: 56 }}>
          <h2 className="marketing-section-title">{tr ? "Aurict nerede ayrışır?" : t("Where Aurict differs")}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {comparison.ourStrengths.map((strength) => <div key={strength} className="marketing-card" style={{ display: "flex", gap: 12, padding: "12px 16px" }}><span style={{ color: "var(--success)", fontSize: 16 }}>✓</span><span style={{ font: "15px/1.5 var(--font-serif)", color: "var(--text-dim)" }}>{strength}</span></div>)}
          </div>
        </section>

        <section className="marketing-card" style={{ padding: "24px 26px", marginBottom: 56 }}>
          <p className="marketing-eyebrow" style={{ marginBottom: 10 }}>{labels.alternative(comparison.competitor)}</p>
          <h2 className="marketing-section-title" style={{ fontSize: 25 }}>
            {labels.question(comparison.competitor)}
          </h2>
          <p className="marketing-copy">
            {tr
              ? `Evet; özellikle terminal tabanlı bir yapay zekâ kodlama ajanında ${comparison.differentiator.toLocaleLowerCase("tr")} arıyorsanız Aurict değerlendirilebilir. Bununla birlikte en doğru seçim, aynı gerçek depo görevini iki araçta çalıştırıp izinleri, diff kalitesini, doğrulama kanıtını, gecikmeyi ve model maliyetini karşılaştırmaktır.`
              : `Yes—especially if you want an AI coding agent centered on ${comparison.differentiator.toLowerCase()}. The reliable way to choose is to run the same representative repository task in both tools and compare permissions, diff quality, verification evidence, latency, and model cost.`}
          </p>
          <Link className="landing-pill mono" href="/ai-coding-agent" style={{ display: "inline-flex", marginTop: 18, textDecoration: "none" }}>{tr ? "kodlama ajanı seçim rehberi" : t("AI coding agent buyer guide")} →</Link>
        </section>

        <section className="marketing-card" style={{ padding: "24px 26px", marginBottom: 56 }}>
          <p className="marketing-eyebrow" style={{ marginBottom: 10 }}>{tr ? "Araştırma notu" : t("Research note")}</p>
          <p className="marketing-copy" style={{ marginBottom: 12 }}>{labels.review(comparison.competitor, comparison.updatedAt)}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {comparison.sources.map((source) => <a key={source.url} className="landing-pill mono" href={source.url} rel="noreferrer" target="_blank">{source.label} ↗</a>)}
          </div>
        </section>

        <section style={{ marginBottom: 56 }}>
          <h2 className="marketing-section-title" style={{ fontSize: 24 }}>{tr ? "Diğer karşılaştırmalar" : t("Other comparisons")}</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {others.map((entry) => <Link key={entry.slug} href={`/compare/${entry.slug}`} className="mono landing-pill" style={{ textDecoration: "none" }}>Aurict vs {entry.competitor}</Link>)}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

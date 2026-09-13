import type { Metadata } from "next"
import { getLocale } from "next-intl/server"
import { Nav } from "@/components/Nav"
import { CopyCommand } from "@/components/CopyCommand"
import { Footer } from "@/components/sections/Footer"
import { JsonLd } from "@/components/seo/JsonLd"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { localizeAiCodingAgent } from "@/content/ai-coding-agent"
import { SUPPORTED_LOCALES, type AppLocale } from "@/i18n/config"
import { localizedMetadata, localizedUrl } from "@/i18n/metadata"
import { Link } from "@/i18n/navigation"
import styles from "../terminal-agent/TerminalAgentPage.module.css"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale() as AppLocale
  const { metadata } = localizeAiCodingAgent(locale)

  return localizedMetadata(locale, "/ai-coding-agent", metadata.title, metadata.description, {
    keywords: metadata.keywords,
    translatedLocales: SUPPORTED_LOCALES,
  })
}

function structuredData(locale: AppLocale) {
  const copy = localizeAiCodingAgent(locale)
  const url = localizedUrl("/ai-coding-agent", locale)

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage", "@id": `${url}#webpage`, url, name: copy.metadata.title,
        description: copy.metadata.description, inLanguage: locale,
        isPartOf: { "@id": "https://aurict.com/#website" }, mainEntity: { "@id": "https://aurict.com/#software" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Aurict", item: localizedUrl("/", locale) },
          { "@type": "ListItem", position: 2, name: copy.breadcrumb, item: url },
        ],
      },
      {
        "@type": "ItemList", name: copy.alternatives.title,
        itemListElement: copy.alternatives.links.map((item, index) => ({
          "@type": "ListItem", position: index + 1, name: item.label, url: localizedUrl(item.href, locale),
        })),
      },
      {
        "@type": "FAQPage", inLanguage: locale,
        mainEntity: copy.faq.items.map((item) => ({
          "@type": "Question", name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  }
}

export default async function AiCodingAgentPage() {
  const locale = await getLocale() as AppLocale
  const copy = localizeAiCodingAgent(locale)

  return (
    <>
      <JsonLd data={structuredData(locale)} />
      <Nav />
      <main className="marketing-main">
        <Breadcrumb items={[{ label: "Aurict", href: "/" }, { label: copy.breadcrumb, href: "/ai-coding-agent" }]} />

        <header className={`marketing-hero ${styles.hero}`}>
          <div>
            <p className="marketing-eyebrow">{copy.hero.eyebrow}</p>
            <h1 className="marketing-title">{copy.hero.title}</h1>
            <p className="marketing-lede">{copy.hero.lede}</p>
          </div>
          <div className={styles.actions}>
            <CopyCommand className={styles.actionPrimary} command="npm install -g aurict" copiedLabel="✓" label={`$ ${copy.hero.install}`} />
            <Link className={styles.actionSecondary} href="/compare">{copy.hero.compare} →</Link>
          </div>
          <div className={styles.proof}>{copy.hero.proof.map((item) => <span key={item}>{item}</span>)}</div>
        </header>

        <section className={`${styles.section} ${styles.definition}`}>
          <h2 className="marketing-section-title">{copy.definition.title}</h2>
          {copy.definition.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>

        <section className={styles.section}>
          <SectionHeader eyebrow={copy.differences.eyebrow} intro={copy.differences.intro} title={copy.differences.title} />
          <CardGrid items={copy.differences.items} />
        </section>

        <section className={styles.section}>
          <SectionHeader eyebrow={copy.evaluation.eyebrow} intro={copy.evaluation.intro} title={copy.evaluation.title} />
          <CardGrid items={copy.evaluation.items} />
        </section>

        <section className={styles.section}>
          <SectionHeader eyebrow={copy.workflows.eyebrow} intro={copy.workflows.intro} title={copy.workflows.title} />
          <div className={styles.useCases}>
            {copy.workflows.items.map((item) => (
              <Link className={styles.useCase} href={item.href} key={item.title}>
                <h3>{item.title}</h3><p>{item.body}</p><i aria-hidden="true">→</i>
              </Link>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.compare}`}>
          <div>
            <p className="marketing-eyebrow">{copy.alternatives.eyebrow}</p>
            <h2>{copy.alternatives.title}</h2><p>{copy.alternatives.body}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
              {copy.alternatives.links.map((item) => <Link className="landing-pill mono" href={item.href} key={item.href} style={{ textDecoration: "none" }}>{item.label}</Link>)}
            </div>
          </div>
          <Link className={styles.actionSecondary} href="/compare">{copy.hero.compare} →</Link>
        </section>

        <section className={styles.section}>
          <SectionHeader eyebrow={copy.faq.eyebrow} title={copy.faq.title} />
          <div className={styles.faqList}>
            {copy.faq.items.map((item) => <article className={styles.faq} key={item.question}><h3>{item.question}</h3><p>{item.answer}</p></article>)}
          </div>
        </section>

        <section className={styles.final}>
          <div><h2>{copy.final.title}</h2><p>{copy.final.body}</p></div>
          <div className={styles.actions}>
            <Link className={styles.actionSecondary} href="/docs">{copy.final.docs}</Link>
            <CopyCommand className={styles.actionPrimary} command="npm install -g aurict" copiedLabel="✓" label={copy.final.install} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

function SectionHeader({ eyebrow, intro, title }: { eyebrow: string; intro?: string; title: string }) {
  return <div className={styles.sectionHeader}><p className="marketing-eyebrow">{eyebrow}</p><h2 className="marketing-section-title">{title}</h2>{intro && <p>{intro}</p>}</div>
}

function CardGrid({ items }: { items: Array<{ title: string; body: string }> }) {
  return <div className={`marketing-grid-line ${styles.cardGrid}`}>{items.map((item, index) => <article className={styles.card} key={item.title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}</div>
}

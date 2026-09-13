import type { Metadata } from "next"
import { getLocale } from "next-intl/server"
import { Nav } from "@/components/Nav"
import { CopyCommand } from "@/components/CopyCommand"
import { JsonLd } from "@/components/seo/JsonLd"
import { Footer } from "@/components/sections/Footer"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { localizeTerminalAgent } from "@/content/terminal-agent"
import { SUPPORTED_LOCALES, type AppLocale } from "@/i18n/config"
import { localizedMetadata, localizedUrl } from "@/i18n/metadata"
import { Link } from "@/i18n/navigation"
import styles from "./TerminalAgentPage.module.css"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale() as AppLocale
  const { metadata } = localizeTerminalAgent(locale)

  return localizedMetadata(locale, "/terminal-agent", metadata.title, metadata.description, {
    keywords: metadata.keywords,
    translatedLocales: SUPPORTED_LOCALES,
  })
}

function structuredData(locale: AppLocale) {
  const copy = localizeTerminalAgent(locale)
  const url = localizedUrl("/terminal-agent", locale)

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: copy.metadata.title,
        description: copy.metadata.description,
        inLanguage: locale,
        dateModified: "2026-09-11",
        keywords: copy.metadata.keywords.join(", "),
        isPartOf: { "@id": "https://aurict.com/#website" },
        mainEntity: { "@id": "https://aurict.com/#software" },
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://aurict.com/#software",
        name: "Aurict Terminal Agent",
        alternateName: "Aurict CLI",
        applicationCategory: "DeveloperApplication",
        applicationSubCategory: "AI coding agent",
        operatingSystem: "macOS, Linux, Windows",
        description: copy.metadata.description,
        url,
        downloadUrl: "https://www.npmjs.com/package/aurict",
        installUrl: "https://aurict.com/install.sh",
        codeRepository: "https://github.com/aurict/aurict",
        license: "https://www.gnu.org/licenses/agpl-3.0.html",
        isAccessibleForFree: true,
        sameAs: ["https://github.com/aurict/aurict", "https://www.npmjs.com/package/aurict"],
        featureList: copy.capabilities.items.map((item) => item.title),
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        author: { "@type": "Organization", name: "Aurict", url: "https://aurict.com" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Aurict", item: localizedUrl("/", locale) },
          { "@type": "ListItem", position: 2, name: copy.breadcrumb, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: copy.faq.items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  }
}

export default async function TerminalAgentPage() {
  const locale = await getLocale() as AppLocale
  const copy = localizeTerminalAgent(locale)

  return (
    <>
      <JsonLd data={structuredData(locale)} />
      <Nav />
      <main className="marketing-main">
        <Breadcrumb items={[{ label: "Aurict", href: "/" }, { label: copy.breadcrumb, href: "/terminal-agent" }]} />

        <header className={`marketing-hero ${styles.hero}`}>
          <div>
            <p className="marketing-eyebrow">{copy.hero.eyebrow}</p>
            <h1 className="marketing-title">{copy.hero.title}</h1>
            <p className="marketing-lede">{copy.hero.lede}</p>
          </div>
          <div className={styles.actions}>
            <CopyCommand className={styles.actionPrimary} command="npm install -g aurict" copiedLabel="✓" label={`$ ${copy.hero.install}`} />
            <a className={styles.actionSecondary} href="https://github.com/aurict/aurict" rel="noopener noreferrer" target="_blank">★ {copy.hero.github}</a>
          </div>
          <div className={styles.proof}>{copy.hero.proof.map((item) => <span key={item}>{item}</span>)}</div>
        </header>

        <section className={`${styles.section} ${styles.definition}`}>
          <h2 className="marketing-section-title">{copy.definition.title}</h2>
          {copy.definition.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>

        <section className={styles.section}>
          <SectionHeader eyebrow={copy.evidence.eyebrow} intro={copy.evidence.intro} title={copy.evidence.title} />
          <div className={`marketing-grid-line ${styles.evidenceGrid}`}>
            {copy.evidence.items.map((item) => {
              const content = <><h3>{item.title}</h3><p>{item.body}</p><span>{item.label} →</span></>
              return item.external
                ? <a className={styles.evidenceCard} href={item.href} key={item.title} rel="noopener noreferrer" target="_blank">{content}</a>
                : <Link className={styles.evidenceCard} href={item.href} key={item.title}>{content}</Link>
            })}
          </div>
        </section>

        <section className={styles.section}>
          <SectionHeader eyebrow={copy.capabilities.eyebrow} intro={copy.capabilities.intro} title={copy.capabilities.title} />
          <div className={`marketing-grid-line ${styles.cardGrid}`}>
            {copy.capabilities.items.map((item, index) => (
              <article className={styles.card} key={item.title}>
                <span>{String(index + 1).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <SectionHeader eyebrow={copy.workflow.eyebrow} title={copy.workflow.title} />
          <div className={styles.workflow}>
            {copy.workflow.steps.map((step, index) => (
              <article className={styles.step} key={step.title}>
                <span>{String(index + 1).padStart(2, "0")}</span><h3>{step.title}</h3><p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <SectionHeader eyebrow={copy.useCases.eyebrow} intro={copy.useCases.intro} title={copy.useCases.title} />
          <div className={styles.useCases}>
            {copy.useCases.items.map((item) => (
              <Link className={styles.useCase} href={item.href} key={item.title}>
                <h3>{item.title}</h3><p>{item.body}</p><i aria-hidden="true">→</i>
              </Link>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.compare}`}>
          <div>
            <p className="marketing-eyebrow">{copy.compare.eyebrow}</p>
            <h2>{copy.compare.title}</h2><p>{copy.compare.body}</p>
          </div>
          <Link className={styles.actionSecondary} href="/compare">{copy.compare.cta} →</Link>
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

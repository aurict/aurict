import type { Metadata } from "next"
import { getLocale } from "next-intl/server"
import { Nav } from "@/components/Nav"
import { Footer } from "@/components/sections/Footer"
import {
  localizeDocsArticleJsonLd,
  localizeDocsBreadcrumbJsonLd,
  localizeDocsSections,
} from "@/content/docs-translations"
import { localizedMetadata } from "@/i18n/metadata"
import type { AppLocale } from "@/i18n/routing"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale() as AppLocale
  return localizedMetadata(
    locale,
    "/docs",
    locale === "tr" ? "Dokümantasyon — Başlangıç" : "Documentation — Getting Started",
    locale === "tr"
      ? "Aurict'i kurun, sağlayıcıları ve API anahtarlarını yapılandırın, Project Auto'yu anlayın, MCP sunucularını bağlayın ve kanıtla tamamlayın."
      : "Install Aurict, configure providers and API keys, understand Project Auto, connect MCP servers, and finish with durable verification evidence.",
  )
}

export default async function DocsPage() {
  const locale = await getLocale() as AppLocale
  const tr = locale === "tr"
  const sections = localizeDocsSections(locale)
  const breadcrumbJsonLd = localizeDocsBreadcrumbJsonLd(locale)
  const articleJsonLd = localizeDocsArticleJsonLd(locale)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <Nav />
      <main className="marketing-main docs-main">
        <div className="marketing-hero">
          <p className="marketing-eyebrow">{tr ? "Dokümantasyon" : "Documentation"}</p>
          <h1 className="marketing-title">{tr ? "Başlangıç" : "Getting started"}</h1>
          <p className="marketing-lede">
            {tr ? "Aurict'i kurmak, yapılandırmak ve güvenle genişletmek için gereken her şey." : "Everything you need to install, configure, and safely extend Aurict."}
          </p>
        </div>

        <div className="resp-docs" style={{ gap: 64 }}>
          <nav className="resp-docs-sidebar" style={{ position: "sticky", top: 80, alignSelf: "start" }}>
            <p className="mono" style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
              {tr ? "Bu sayfada" : "On this page"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {sections.map((section) => <a key={section.anchor} href={`#${section.anchor}`} className="docs-sidebar-link">{section.title}</a>)}
            </div>
          </nav>

          <div style={{ display: "flex", flexDirection: "column", gap: 64 }}>
            {sections.map((section) => (
              <section key={section.anchor} id={section.anchor}>
                <h2 className="marketing-section-title">{section.title}</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                  {section.content.map((item) => (
                    <article key={item.heading} className="marketing-card" style={{ padding: "24px 26px", position: "relative" }}>
                      <span className="mono aur-corner" style={{ position: "absolute", top: 8, left: 8, color: "oklch(1 0 0/.18)" }}>┌</span>
                      <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>{item.heading}</h3>
                      <p className="marketing-copy" style={{ marginBottom: 14, whiteSpace: "pre-wrap" }}>{item.body}</p>
                      <pre className="marketing-code"><code>{item.code}</code></pre>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

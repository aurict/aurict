import type { Metadata } from "next"
import { getLocale } from "next-intl/server"
import { Nav } from "@/components/Nav"
import { Footer } from "@/components/sections/Footer"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { getLegalPage } from "@/content/legal"
import { localizedMetadata } from "@/i18n/metadata"
import type { AppLocale } from "@/i18n/routing"
import { localizeEnglish } from "@/i18n/content"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale() as AppLocale
  return localizedMetadata(locale, "/terms", locale === "tr" ? "Kullanım Koşulları" : localizeEnglish(locale, "Terms of Use"), locale === "tr" ? "Aurict kullanım koşulları; açık kaynak yazılım, BYOK sorumlulukları, güvenlik ve politika değişikliklerini kapsar." : localizeEnglish(locale, "Aurict terms of use covering open-source software, BYOK responsibilities, acceptable use, security workflows, disclaimers, and policy changes."))
}

export default async function TermsPage() {
  const locale = await getLocale() as AppLocale
  const page = getLegalPage("terms", locale)
  return (
    <>
      <Nav />
      <main className="marketing-main marketing-main-narrow">
        <Breadcrumb items={[{ label: locale === "tr" ? "Ana sayfa" : localizeEnglish(locale, "Home"), href: "/" }, { label: page.breadcrumb, href: "/terms" }]} />
        <section className="marketing-hero" style={{ marginTop: 24 }}>
          <p className="marketing-eyebrow">{page.eyebrow}</p>
          <h1 className="marketing-title marketing-title-sm">{page.title}</h1>
          <p className="marketing-lede">{page.lede}</p>
        </section>

        <LegalSections sections={page.sections} />
      </main>
      <Footer />
    </>
  )
}

function LegalSections({ sections }: { sections: Array<{ title: string; body: string[] }> }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="marketing-section-title">{section.title}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="marketing-copy">{paragraph}</p>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

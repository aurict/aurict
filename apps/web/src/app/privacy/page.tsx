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
  return localizedMetadata(locale, "/privacy", locale === "tr" ? "Gizlilik Politikası" : localizeEnglish(locale, "Privacy Policy"), locale === "tr" ? "Aurict gizlilik politikası; mevcut veri toplama, BYOK iş akışları, üçüncü taraf sağlayıcılar ve gelecekteki değişiklikleri kapsar." : localizeEnglish(locale, "Aurict privacy policy covering current data collection, BYOK workflows, third-party providers, future changes, and user responsibilities."))
}

export default async function PrivacyPage() {
  const locale = await getLocale() as AppLocale
  const page = getLegalPage("privacy", locale)
  return (
    <>
      <Nav />
      <main className="marketing-main marketing-main-narrow">
        <Breadcrumb items={[{ label: locale === "tr" ? "Ana sayfa" : localizeEnglish(locale, "Home"), href: "/" }, { label: page.breadcrumb, href: "/privacy" }]} />
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

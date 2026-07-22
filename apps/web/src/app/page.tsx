import type { Metadata } from "next"
import { AurictLandingExact } from "@/components/landing/AurictLandingExact"
import { getLocale } from "next-intl/server"
import type { AppLocale } from "@/i18n/routing"
import { localizedMetadata } from "@/i18n/metadata"
import { localizeFaqJsonLd, localizeHowToJsonLd, localizeHomeJsonLd } from "@/content/home-translations"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale() as AppLocale
  return localizedMetadata(
    locale,
    "/",
    locale === "tr" ? "Aurict — Terminal tabanlı yapay zeka kodlama asistanı" : "Aurict — Terminal-native AI coding assistant",
    locale === "tr"
      ? "Çoklu ajan kodlama, MCP, yerel bağlam, sınırlı Project Auto ve açık onaylar için açık kaynaklı terminal çalışma zamanı. Aurict ayrıca yerel öncelikli masaüstü çalışma alanı olan Hoprel'i ve Aurict Mobile'ı sunar."
      : "Open-source terminal runtime for multi-agent coding, MCP, local context, scoped Project Auto, and explicit approvals. Aurict also ships Hoprel, its local-first desktop workspace, and Aurict Mobile.",
  )
}

export default async function Home() {
  const locale = await getLocale() as AppLocale
  const jsonLd = localizeHomeJsonLd(locale)
  const faqJsonLd = localizeFaqJsonLd(locale)
  const howToJsonLd = localizeHowToJsonLd(locale)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <AurictLandingExact />
    </>
  )
}

import type { Metadata } from "next"
import { getLocale } from "next-intl/server"
import { localizedMetadata } from "@/i18n/metadata"
import type { AppLocale } from "@/i18n/routing"
import { localizeEnglish } from "@/i18n/content"

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale
  const t = (source: string) => localizeEnglish(locale, source)
  const title =
    locale === "tr"
      ? "Kullanım Alanları — Yapay Zekâ ile Geliştirme"
      : t("Use Cases — AI-Powered Development Workflows")
  const description =
    locale === "tr"
      ? "Aurict'in uzman ajanlarla yeniden düzenleme, kod incelemesi, test ve dokümantasyon işlerini nasıl yürüttüğünü gerçek örneklerle keşfedin."
      : t("Discover how Aurict's specialist agents handle refactoring, code review, testing, documentation, and more through real development examples.")
  return localizedMetadata(locale, "/use-cases", title, description)
}

export default function UseCasesLayout({ children }: { children: React.ReactNode }) {
  return children
}

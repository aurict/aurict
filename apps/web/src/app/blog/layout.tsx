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
      ? "Blog — Yapay Zeka Kodlama İçgörüleri ve Eğitimleri"
      : t("Blog — AI Coding Insights & Tutorials")
  const description =
    locale === "tr"
      ? "Yapay zeka kodlama asistanları, terminal yapay zeka araçları, çoklu ajan mimarisi ve Aurict ile geliştirme akışını nasıl hızlandıracağını öğren."
      : t("Learn about AI coding assistants, terminal AI tools, multi-agent architecture, and how to improve your development workflow with Aurict.")
  return localizedMetadata(locale, "/blog", title, description)
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children
}

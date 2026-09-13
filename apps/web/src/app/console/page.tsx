import type { Metadata } from "next"
import { getLocale } from "next-intl/server"
import type { AppLocale } from "@/i18n/routing"
import { redirect } from "@/i18n/navigation"
import { localizedMetadata } from "@/i18n/metadata"
import { localizeEnglish } from "@/i18n/content"

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale
  return {
    ...localizedMetadata(
      locale,
      "/console",
      locale === "tr" ? "Konsol" : localizeEnglish(locale, "Console"),
      locale === "tr" ? "Aurict kontrol paneli." : localizeEnglish(locale, "The Aurict console."),
    ),
    robots: { index: false, follow: false },
  }
}

export default async function ConsolePage() {
  const locale = (await getLocale()) as AppLocale
  redirect({ href: "/console/account", locale })
}

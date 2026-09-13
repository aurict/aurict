import type { Metadata } from "next"
import { CursorGate } from "@/components/ui/CursorGate"
import { getLocale } from "next-intl/server"
import type { AppLocale } from "@/i18n/routing"
import { localizedMetadata } from "@/i18n/metadata"
import { localizeEnglish } from "@/i18n/content"

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale
  return {
    ...localizedMetadata(
      locale,
      "/cursor",
      locale === "tr" ? "Cursor" : "Cursor",
      locale === "tr"
        ? "Aurict'i Cursor içinden kullanın."
        : localizeEnglish(locale, "Use Aurict from inside Cursor."),
    ),
    robots: { index: false, follow: false },
  }
}

export default function CursorPage() {
  return <CursorGate />
}

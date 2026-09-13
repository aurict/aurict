import type { Metadata } from "next"
import { AccountConsole } from "@/components/console/AccountConsole"
import { getLocale } from "next-intl/server"
import type { AppLocale } from "@/i18n/routing"
import { localizedMetadata } from "@/i18n/metadata"
import { localizeEnglish } from "@/i18n/content"

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale
  return {
    ...localizedMetadata(
      locale,
      "/console/account",
      locale === "tr" ? "Hesap Konsolu" : localizeEnglish(locale, "Account Console"),
      locale === "tr" ? "Aurict hesabınızı yönetin." : localizeEnglish(locale, "Manage your Aurict account."),
    ),
    robots: { index: false, follow: false },
  }
}

export default function AccountConsolePage() {
  return <AccountConsole />
}

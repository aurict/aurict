import type { Metadata } from "next"
import { getLocale } from "next-intl/server"
import { localizedMetadata } from "@/i18n/metadata"
import type { AppLocale } from "@/i18n/routing"
import { EmailAction } from "@/components/auth/EmailAction"

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale
  const title = locale === "tr" ? "Parolanızı sıfırlayın" : "Reset your password"
  const base = localizedMetadata(locale, "/auth/reset-password", title, title)
  return { ...base, robots: { index: false, follow: false } }
}

export default function Page() {
  return <EmailAction mode="reset" />
}

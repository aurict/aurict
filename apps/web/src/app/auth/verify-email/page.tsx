import type { Metadata } from "next"
import { getLocale } from "next-intl/server"
import { localizedMetadata } from "@/i18n/metadata"
import type { AppLocale } from "@/i18n/routing"
import { EmailAction } from "@/components/auth/EmailAction"

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale
  const title = locale === "tr" ? "E-postanızı doğrulayın" : "Verify your email"
  const base = localizedMetadata(locale, "/auth/verify-email", title, title)
  return { ...base, robots: { index: false, follow: false } }
}

export default function Page() {
  return <EmailAction mode="verify" />
}

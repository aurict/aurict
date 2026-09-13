import type { Metadata } from "next"
import { Suspense } from "react"
import { getLocale } from "next-intl/server"
import { localizedMetadata } from "@/i18n/metadata"
import type { AppLocale } from "@/i18n/routing"
import { DeviceLogin } from "@/components/auth/DeviceLogin"
import { localizeEnglish } from "@/i18n/content"

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale
  const base = localizedMetadata(
    locale,
    "/auth/device",
    locale === "tr" ? "CLI tarayıcı girişi" : localizeEnglish(locale, "CLI browser login"),
    locale === "tr"
      ? "Bir Aurict CLI tarayıcı giriş isteğini yetkilendir."
      : localizeEnglish(locale, "Authorize an Aurict CLI browser login request."),
  )
  return { ...base, robots: { index: false, follow: false } }
}

export default function DeviceLoginPage() {
  return (
    <Suspense fallback={<div className="auth-shell" />}>
      <DeviceLogin />
    </Suspense>
  )
}

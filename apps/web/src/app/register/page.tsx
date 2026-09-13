import type { Metadata } from "next"
import { Suspense } from "react"
import { AuthForm } from "@/components/auth/AuthForm"
import { getLocale } from "next-intl/server"
import type { AppLocale } from "@/i18n/routing"
import { localizedMetadata } from "@/i18n/metadata"
import { localizeEnglish } from "@/i18n/content"

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale
  return {
    ...localizedMetadata(
      locale,
      "/register",
      locale === "tr" ? "Hesap oluştur" : localizeEnglish(locale, "Create account"),
      locale === "tr"
        ? "Web, mobil ve CLI tarayıcı girişi için Aurict hesabı oluşturun."
        : localizeEnglish(locale, "Create your Aurict account for web, mobile, and CLI browser login."),
    ),
    robots: { index: false, follow: false },
  }
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="auth-shell" />}>
      <AuthForm mode="register" />
    </Suspense>
  )
}

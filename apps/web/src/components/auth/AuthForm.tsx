"use client"

import { useMemo, useState } from "react"
import { useLocale } from "next-intl"
import { Link } from "@/i18n/navigation"
import { useSearchParams } from "next/navigation"
import { ArrowRight, LoaderCircle, LockKeyhole, Mail } from "lucide-react"
import { BrandMark } from "@/components/BrandMark"
import { firebaseProvider, loadFirebase, readFirebaseError } from "@/lib/auth/firebase-client"
import type { AppLocale } from "@/i18n/routing"
import { localizeEnglish } from "@/i18n/client-content"

type AuthMode = "login" | "register"

export function AuthForm({ mode }: { mode: AuthMode }) {
  const locale = useLocale() as AppLocale
  const tr = locale === "tr"
  const t = (source: string) => localizeEnglish(locale, source)
  const search = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<"password" | "google" | "github" | null>(null)

  const nextPath = useMemo(() => sanitizeNextPath(search.get("next")), [search])
  const isRegister = mode === "register"

  async function submitPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading("password")
    try {
      const result = await postAuth(isRegister ? "/api/auth/register" : "/api/auth/login", {
        email: email.trim(),
        password,
      }, tr ? "Geçersiz sunucu yanıtı." : t("Invalid server response."))
      if (!result.ok) throw new Error(result.error?.message ?? (tr ? "Kimlik doğrulama başarısız oldu." : t("Authentication failed.")))
      window.location.assign(nextPath)
    } catch (err) {
      setError(err instanceof Error ? err.message : (tr ? "Kimlik doğrulama başarısız oldu." : t("Authentication failed.")))
    } finally {
      setLoading(null)
    }
  }

  async function submitProvider(provider: "google" | "github") {
    setError(null)
    setLoading(provider)
    try {
      const firebase = await loadFirebase()
      const authProvider = firebaseProvider(firebase, provider)
      const credential = await firebase.auth().signInWithPopup(authProvider)
      const idToken = await credential.user.getIdToken()
      const result = await postAuth("/api/auth/firebase", { idToken }, tr ? "Geçersiz sunucu yanıtı." : t("Invalid server response."))
      if (!result.ok) throw new Error(result.error?.message ?? (tr ? "Sağlayıcıyla giriş başarısız oldu." : t("Provider login failed.")))
      window.location.assign(nextPath)
    } catch (err) {
      setError(tr ? readFirebaseError(err) : t(readFirebaseError(err)))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-panel marketing-card">
        <BrandMark size="auth" />
        <p className="marketing-eyebrow">{isRegister ? (tr ? "Hesap oluştur" : t("Create account")) : (tr ? "Tekrar hoş geldiniz" : t("Welcome back"))}</p>
        <h1 className="marketing-title marketing-title-sm" style={{ marginBottom: 12 }}>
          {isRegister ? (tr ? "Aurict ile başlayın." : t("Start with Aurict.")) : (tr ? "Aurict'e giriş yapın." : t("Sign in to Aurict."))}
        </h1>
        <p className="marketing-lede" style={{ fontSize: 16, marginBottom: 28 }}>
          {isRegister
            ? (tr ? "Web sitesi, mobil uygulama ve CLI tarayıcı girişi için tek hesabı kullanın." : t("Use one account across the website, mobile app, and CLI browser login."))
            : (tr ? "Aurict hesabınıza devam edin, CLI giriş isteklerini onaylayın ve bağlı cihazları yönetin." : t("Continue to your Aurict account, approve CLI login requests, and manage connected devices."))}
        </p>

        <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
          <ProviderButton
            disabled={loading !== null}
            icon={loading === "google" ? <LoaderCircle className="auth-spin" size={16} /> : <span className="auth-google-mark">G</span>}
            label={isRegister ? (tr ? "Google ile kaydol" : t("Sign up with Google")) : (tr ? "Google ile giriş yap" : t("Sign in with Google"))}
            loading={loading === "google"}
            onClick={() => submitProvider("google")}
            openingLabel={tr ? "Sağlayıcı açılıyor..." : t("Opening provider...")}
          />
          <ProviderButton
            disabled={loading !== null}
            icon={loading === "github" ? <LoaderCircle className="auth-spin" size={16} /> : <span className="auth-github-mark">GH</span>}
            label={isRegister ? (tr ? "GitHub ile kaydol" : t("Sign up with GitHub")) : (tr ? "GitHub ile giriş yap" : t("Sign in with GitHub"))}
            loading={loading === "github"}
            onClick={() => submitProvider("github")}
            openingLabel={tr ? "Sağlayıcı açılıyor..." : t("Opening provider...")}
          />
        </div>

        <div className="auth-divider"><span>{tr ? "veya e-posta kullanın" : t("or use email")}</span></div>

        <form onSubmit={submitPassword} style={{ display: "grid", gap: 14 }}>
          <label className="auth-label">
            {tr ? "e-posta" : t("email")}
            <span className="auth-input-wrap">
              <Mail aria-hidden="true" size={16} />
              <input
                autoComplete="email"
                className="auth-input"
                inputMode="email"
                maxLength={254}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </span>
          </label>
          <label className="auth-label">
            {tr ? "parola" : t("password")}
            <span className="auth-input-wrap">
              <LockKeyhole aria-hidden="true" size={16} />
              <input
                autoComplete={isRegister ? "new-password" : "current-password"}
                className="auth-input"
                maxLength={1024}
                minLength={isRegister ? 10 : 1}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={isRegister ? (tr ? "en az 10 karakter" : t("minimum 10 characters")) : (tr ? "parolanız" : t("your password"))}
                required
                type="password"
                value={password}
              />
            </span>
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button className="landing-button-primary mono" disabled={loading !== null} style={{ justifyContent: "center", marginTop: 4 }} type="submit">
            {loading === "password" ? (
              <>
                <LoaderCircle className="auth-spin" size={16} />
                {tr ? "çalışıyor..." : t("working...")}
              </>
            ) : (
              <>
                {isRegister ? (tr ? "hesap oluştur" : t("create account")) : (tr ? "giriş yap" : t("sign in"))}
                <ArrowRight aria-hidden="true" size={16} />
              </>
            )}
          </button>
        </form>

        <p className="mono" style={{ color: "var(--text-muted)", fontSize: 12.5, marginTop: 22, textAlign: "center" }}>
          {isRegister ? (tr ? "Zaten hesabınız var mı?" : t("Already have an account?")) : (tr ? "Aurict'te yeni misiniz?" : t("New to Aurict?"))}{" "}
          <Link href={isRegister ? nextHref("/login", nextPath) : nextHref("/register", nextPath)} style={{ color: "var(--accent)", textDecoration: "none" }}>
            {isRegister ? (tr ? "Giriş yap" : t("Sign in")) : (tr ? "Hesap oluştur" : t("Create one"))}
          </Link>
        </p>
      </div>
    </div>
  )
}

function ProviderButton({
  disabled,
  icon,
  label,
  loading,
  onClick,
  openingLabel,
}: {
  disabled: boolean
  icon: React.ReactNode
  label: string
  loading: boolean
  onClick(): void
  openingLabel: string
}) {
  return (
    <button
      aria-busy={loading}
      className="auth-provider-button"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span aria-hidden="true">{icon}</span>
      {loading ? openingLabel : label}
    </button>
  )
}

async function postAuth(path: string, body: unknown, invalidResponseMessage: string) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
  const json = await response.json().catch(() => ({ ok: false, error: { message: invalidResponseMessage } }))
  return json as { ok: boolean; error?: { message?: string } }
}

function sanitizeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/"
  return value
}

function nextHref(path: string, nextPath: string) {
  return nextPath === "/" ? path : `${path}?next=${encodeURIComponent(nextPath)}`
}

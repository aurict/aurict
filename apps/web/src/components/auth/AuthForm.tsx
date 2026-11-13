"use client"

import { useMemo, useState } from "react"
import { sanitizeNextPath } from "@/lib/auth/safe-redirect"
import { useLocale } from "next-intl"
import { Link } from "@/i18n/navigation"
import { useSearchParams } from "next/navigation"
import { ArrowRight, LoaderCircle, LockKeyhole, Mail } from "lucide-react"
import { BrandMark } from "@/components/BrandMark"
import { firebaseProvider, loadFirebase, readFirebaseError } from "@/lib/auth/firebase-client"

type AuthMode = "login" | "register"

export function AuthForm({ mode }: { mode: AuthMode }) {
  const tr = useLocale() === "tr"
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
      }, tr)
      if (!result.ok) throw new Error(result.error?.message ?? (tr ? "Kimlik doğrulama başarısız oldu." : "Authentication failed."))
      window.location.assign(nextPath)
    } catch (err) {
      setError(err instanceof Error ? err.message : (tr ? "Kimlik doğrulama başarısız oldu." : "Authentication failed."))
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
      const result = await postAuth("/api/auth/firebase", { idToken }, tr)
      if (!result.ok) throw new Error(result.error?.message ?? (tr ? "Sağlayıcıyla giriş başarısız oldu." : "Provider login failed."))
      window.location.assign(nextPath)
    } catch (err) {
      setError(readFirebaseError(err))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-panel marketing-card">
        <BrandMark size="auth" />
        <p className="marketing-eyebrow">{isRegister ? (tr ? "Hesap oluştur" : "Create account") : (tr ? "Tekrar hoş geldiniz" : "Welcome back")}</p>
        <h1 className="marketing-title marketing-title-sm" style={{ marginBottom: 12 }}>
          {isRegister ? (tr ? "Aurict ile başlayın." : "Start with Aurict.") : (tr ? "Aurict'e giriş yapın." : "Sign in to Aurict.")}
        </h1>
        <p className="marketing-lede" style={{ fontSize: 16, marginBottom: 28 }}>
          {isRegister
            ? (tr ? "Web sitesi, mobil uygulama ve CLI tarayıcı girişi için tek hesabı kullanın." : "Use one account across the website, mobile app, and CLI browser login.")
            : (tr ? "Aurict hesabınıza devam edin, CLI giriş isteklerini onaylayın ve bağlı cihazları yönetin." : "Continue to your Aurict account, approve CLI login requests, and manage connected devices.")}
        </p>

        <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
          <ProviderButton
            disabled={loading !== null}
            icon={loading === "google" ? <LoaderCircle className="auth-spin" size={16} /> : <span className="auth-google-mark">G</span>}
            label={isRegister ? (tr ? "Google ile kaydol" : "Sign up with Google") : (tr ? "Google ile giriş yap" : "Sign in with Google")}
            loading={loading === "google"}
            onClick={() => submitProvider("google")}
            tr={tr}
          />
          <ProviderButton
            disabled={loading !== null}
            icon={loading === "github" ? <LoaderCircle className="auth-spin" size={16} /> : <span className="auth-github-mark">GH</span>}
            label={isRegister ? (tr ? "GitHub ile kaydol" : "Sign up with GitHub") : (tr ? "GitHub ile giriş yap" : "Sign in with GitHub")}
            loading={loading === "github"}
            onClick={() => submitProvider("github")}
            tr={tr}
          />
        </div>

        <div className="auth-divider"><span>{tr ? "veya e-posta kullanın" : "or use email"}</span></div>

        <form onSubmit={submitPassword} style={{ display: "grid", gap: 14 }}>
          <label className="auth-label">
            {tr ? "e-posta" : "email"}
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
            {tr ? "parola" : "password"}
            <span className="auth-input-wrap">
              <LockKeyhole aria-hidden="true" size={16} />
              <input
                autoComplete={isRegister ? "new-password" : "current-password"}
                className="auth-input"
                maxLength={1024}
                minLength={isRegister ? 10 : 1}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={isRegister ? (tr ? "en az 10 karakter" : "minimum 10 characters") : (tr ? "parolanız" : "your password")}
                required
                type="password"
                value={password}
              />
            </span>
          </label>

          {!isRegister && (
            <Link className="auth-muted-link mono" href="/auth/reset-password" style={{ justifySelf: "end", marginTop: -6 }}>
              {tr ? "parolanızı mı unuttunuz?" : "forgot password?"}
            </Link>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button className="landing-button-primary mono" disabled={loading !== null} style={{ justifyContent: "center", marginTop: 4 }} type="submit">
            {loading === "password" ? (
              <>
                <LoaderCircle className="auth-spin" size={16} />
                {tr ? "çalışıyor..." : "working..."}
              </>
            ) : (
              <>
                {isRegister ? (tr ? "hesap oluştur" : "create account") : (tr ? "giriş yap" : "sign in")}
                <ArrowRight aria-hidden="true" size={16} />
              </>
            )}
          </button>
        </form>

        <p className="mono" style={{ color: "var(--text-muted)", fontSize: 12.5, marginTop: 22, textAlign: "center" }}>
          {isRegister ? (tr ? "Zaten hesabınız var mı?" : "Already have an account?") : (tr ? "Aurict'te yeni misiniz?" : "New to Aurict?")}{" "}
          <Link href={isRegister ? nextHref("/login", nextPath) : nextHref("/register", nextPath)} style={{ color: "var(--accent)", textDecoration: "none" }}>
            {isRegister ? (tr ? "Giriş yap" : "Sign in") : (tr ? "Hesap oluştur" : "Create one")}
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
  tr,
}: {
  disabled: boolean
  icon: React.ReactNode
  label: string
  loading: boolean
  onClick(): void
  tr: boolean
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
      {loading ? (tr ? "Sağlayıcı açılıyor..." : "Opening provider...") : label}
    </button>
  )
}

async function postAuth(path: string, body: unknown, tr: boolean) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
  const json = await response.json().catch(() => ({ ok: false, error: { message: tr ? "Geçersiz sunucu yanıtı." : "Invalid server response." } }))
  return json as { ok: boolean; error?: { message?: string } }
}


function nextHref(path: string, nextPath: string) {
  return nextPath === "/" ? path : `${path}?next=${encodeURIComponent(nextPath)}`
}

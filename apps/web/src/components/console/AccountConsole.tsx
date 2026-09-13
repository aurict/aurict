"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { useLocale } from "next-intl"
import { Link } from "@/i18n/navigation"
import { AlertTriangle, CheckCircle2, KeyRound, LoaderCircle, LogOut, ShieldCheck, Trash2, UserRound } from "lucide-react"
import { BrandMark } from "@/components/BrandMark"
import { firebaseProvider, loadFirebase, readFirebaseError } from "@/lib/auth/firebase-client"
import type { AppLocale } from "@/i18n/routing"
import { localizeEnglish } from "@/i18n/client-content"

type ConsoleUser = {
  id: string
  email: string
  emailVerifiedAt?: string
  createdAt: string
  providers?: string[]
}

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; user: ConsoleUser }

export function AccountConsole() {
  const locale = useLocale() as AppLocale
  const tr = locale === "tr"
  const t = useCallback((source: string) => localizeEnglish(locale, source), [locale])
  const [state, setState] = useState<LoadState>({ status: "loading" })
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadAccount() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" })
        const body = await response.json().catch(() => undefined)
        if (cancelled) return
        if (response.status === 401) {
          window.location.assign(`/login?next=${encodeURIComponent("/console/account")}`)
          return
        }
        if (!response.ok || !body?.ok) {
          setState({ status: "error", message: body?.error?.message ?? (tr ? "Hesap yüklenemedi." : t("Could not load account.")) })
          return
        }
        setState({ status: "ready", user: body.user as ConsoleUser })
      } catch {
        if (!cancelled) setState({ status: "error", message: tr ? "Hesap hizmetine ulaşılamadı." : t("Could not reach the account service.") })
      }
    }
    void loadAccount()
    return () => {
      cancelled = true
    }
  }, [t, tr])

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined)
    window.location.assign("/")
  }

  return (
    <main className="console-shell">
      <div className="console-topline" />
      <div className="console-layout">
        <aside className="console-sidebar">
          <BrandMark compact />
          <nav className="console-nav" aria-label={tr ? "Konsol" : t("Console")}>
            <Link className="console-nav-link console-nav-link-active" href="/console/account">
              <UserRound aria-hidden="true" size={15} />
              {tr ? "hesap" : t("account")}
            </Link>
          </nav>
        </aside>

        <section className="console-main">
          <div className="console-header">
            <div>
              <p className="marketing-eyebrow">{tr ? "konsol" : t("console")}</p>
              <h1 className="console-title">{tr ? "Hesap" : t("Account")}</h1>
            </div>
            <button className="console-secondary-action mono" onClick={signOut} type="button">
              <LogOut aria-hidden="true" size={15} />
              {tr ? "çıkış yap" : t("sign out")}
            </button>
          </div>

          {state.status === "loading" && (
            <div className="console-panel console-loading mono">
              <LoaderCircle className="auth-spin" size={16} />
              {tr ? "hesap yükleniyor..." : t("loading account...")}
            </div>
          )}

          {state.status === "error" && <div className="auth-error">{state.message}</div>}

          {state.status === "ready" && (
            <>
              <AccountOverview locale={locale} user={state.user} />
              <DangerZone locale={locale} user={state.user} onDelete={() => setDeleteOpen(true)} />
              {deleteOpen && <DeleteAccountDialog locale={locale} user={state.user} onClose={() => setDeleteOpen(false)} />}
            </>
          )}
        </section>
      </div>
    </main>
  )
}

function AccountOverview({ locale, user }: { locale: AppLocale; user: ConsoleUser }) {
  const tr = locale === "tr"
  const t = (source: string) => localizeEnglish(locale, source)
  const providers = user.providers?.length ? user.providers : ["password"]
  return (
    <div className="console-panel">
      <div className="console-panel-heading">
        <ShieldCheck aria-hidden="true" size={18} />
        <div>
          <h2>{tr ? "Profil" : t("Profile")}</h2>
          <p>{tr ? "Web, mobil ve tarayıcı tabanlı CLI girişinde kullanılan temel hesap kimliği." : t("Core account identity used by web, mobile, and browser-based CLI login.")}</p>
        </div>
      </div>
      <div className="console-info-grid">
        <InfoItem label={tr ? "e-posta" : t("email")} value={user.email} />
        <InfoItem label={tr ? "oluşturulma" : t("created")} value={formatDate(user.createdAt, locale)} />
        <InfoItem label={tr ? "e-posta doğrulaması" : t("email verification")} value={user.emailVerifiedAt ? (tr ? "doğrulandı" : t("verified")) : (tr ? "doğrulanmadı" : t("not verified"))} />
        <div className="console-info-item">
          <span>{tr ? "sağlayıcılar" : t("providers")}</span>
          <div className="console-provider-row">
            {providers.map((provider) => <span key={provider} className="console-provider-pill">{provider}</span>)}
          </div>
        </div>
      </div>
    </div>
  )
}

function DangerZone({ locale, user, onDelete }: { locale: AppLocale; user: ConsoleUser; onDelete(): void }) {
  const tr = locale === "tr"
  const t = (source: string) => localizeEnglish(locale, source)
  return (
    <div className="console-panel console-danger-panel">
      <div className="console-panel-heading">
        <AlertTriangle aria-hidden="true" size={18} />
        <div>
          <h2>{tr ? "Tehlikeli alan" : t("Danger zone")}</h2>
          <p>{dangerDescription(locale, user.email)}</p>
        </div>
      </div>
      <button className="auth-danger-button mono" onClick={onDelete} type="button">
        <Trash2 aria-hidden="true" size={16} />
        {tr ? "hesabı sil" : t("delete account")}
      </button>
    </div>
  )
}

function DeleteAccountDialog({ locale, user, onClose }: { locale: AppLocale; user: ConsoleUser; onClose(): void }) {
  const tr = locale === "tr"
  const t = (source: string) => localizeEnglish(locale, source)
  const providers = useMemo(() => new Set(user.providers ?? []), [user.providers])
  const needsPassword = providers.has("password")
  const hasFirebase = providers.has("firebase")
  const [confirmation, setConfirmation] = useState("")
  const [password, setPassword] = useState("")
  const [firebaseIdToken, setFirebaseIdToken] = useState<string | null>(null)
  const [verifiedProvider, setVerifiedProvider] = useState<"google" | "github" | null>(null)
  const [providerLoading, setProviderLoading] = useState<"google" | "github" | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canSubmit = confirmation.trim().toLowerCase() === user.email.toLowerCase() &&
    (!needsPassword || password.length >= 10 || !!firebaseIdToken) &&
    (!hasFirebase || !!firebaseIdToken || !!password)

  async function verifyProvider(provider: "google" | "github") {
    setError(null)
    setProviderLoading(provider)
    try {
      const firebase = await loadFirebase()
      const credential = await firebase.auth().signInWithPopup(firebaseProvider(firebase, provider))
      setFirebaseIdToken(await credential.user.getIdToken(true))
      setVerifiedProvider(provider)
    } catch (err) {
      setError(tr ? readFirebaseError(err) : t(readFirebaseError(err)))
    } finally {
      setProviderLoading(null)
    }
  }

  async function submitDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return
    setError(null)
    setSubmitting(true)
    const payload: Record<string, string> = { confirmation: confirmation.trim() }
    if (password) payload.password = password
    if (firebaseIdToken) payload.firebaseIdToken = firebaseIdToken

    try {
      const response = await fetch("/api/auth/account", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await response.json().catch(() => undefined)
      if (!response.ok || !body?.ok) throw new Error(body?.error?.message ?? (tr ? "Hesap silinemedi." : t("Could not delete account.")))
      window.location.assign("/?account=deleted")
    } catch (err) {
      setError(err instanceof Error ? err.message : (tr ? "Hesap silinemedi." : t("Could not delete account.")))
      setSubmitting(false)
    }
  }

  return (
    <div className="console-modal-backdrop" role="presentation">
      <form className="console-modal" onSubmit={submitDelete}>
        <div className="console-modal-head">
          <div className="console-modal-icon"><Trash2 aria-hidden="true" size={18} /></div>
          <div>
            <h2>{tr ? "Hesabı sil" : t("Delete account")}</h2>
            <p>{tr ? "Bu işlem etkin oturumları iptal eder ve Aurict hesap erişimini kaldırır." : t("This action revokes active sessions and removes Aurict account access.")}</p>
          </div>
        </div>

        <label className="auth-label">
          {tr ? "e-postayı doğrula" : t("confirm email")}
          <span className="auth-input-wrap">
            <UserRound aria-hidden="true" size={16} />
            <input className="auth-input" onChange={(event) => setConfirmation(event.target.value)} placeholder={user.email} value={confirmation} />
          </span>
        </label>

        {needsPassword && (
          <label className="auth-label">
            {tr ? "parola" : t("password")}
            <span className="auth-input-wrap">
              <KeyRound aria-hidden="true" size={16} />
              <input className="auth-input" minLength={10} onChange={(event) => setPassword(event.target.value)} placeholder={tr ? "hesap parolası" : t("account password")} type="password" value={password} />
            </span>
          </label>
        )}

        {hasFirebase && (
          <div className="console-provider-verify">
            <button className="auth-provider-button" disabled={providerLoading !== null || submitting} onClick={() => verifyProvider("google")} type="button">
              <span aria-hidden="true">{providerLoading === "google" ? <LoaderCircle className="auth-spin" size={16} /> : "G"}</span>
              {tr ? "Google ile doğrula" : t("verify with Google")}
            </button>
            <button className="auth-provider-button" disabled={providerLoading !== null || submitting} onClick={() => verifyProvider("github")} type="button">
              <span aria-hidden="true">{providerLoading === "github" ? <LoaderCircle className="auth-spin" size={16} /> : "GH"}</span>
              {tr ? "GitHub ile doğrula" : t("verify with GitHub")}
            </button>
            {verifiedProvider && (
              <div className="console-verified mono">
                <CheckCircle2 aria-hidden="true" size={14} />
                {verifiedProvider} {tr ? "doğrulandı" : t("verified")}
              </div>
            )}
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}

        <div className="console-modal-actions">
          <button className="console-secondary-action mono" disabled={submitting} onClick={onClose} type="button">{tr ? "vazgeç" : t("cancel")}</button>
          <button className="auth-danger-button mono" disabled={!canSubmit || submitting} type="submit">
            {submitting ? <LoaderCircle className="auth-spin" size={16} /> : <Trash2 aria-hidden="true" size={16} />}
            {tr ? "kalıcı olarak sil" : t("delete permanently")}
          </button>
        </div>
      </form>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="console-info-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function formatDate(value: string, locale: AppLocale) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date)
}

function dangerDescription(locale: AppLocale, email: string) {
  if (locale === "tr") return `${email} hesabını silin; hesap oturumları, güvenilen cihazlar, gizli aktarım ve uzaktan oturumları iptal edin.`
  if (locale === "de") return `${email} löschen und Kontositzungen, vertrauenswürdige Geräte, geheime Übertragungen und Remotesitzungen widerrufen.`
  if (locale === "fr") return `Supprimez ${email} et révoquez les sessions du compte, les appareils de confiance, les transferts secrets et les sessions à distance.`
  if (locale === "es") return `Elimina ${email} y revoca las sesiones de la cuenta, los dispositivos de confianza, las transferencias secretas y las sesiones remotas.`
  return `Delete ${email} and revoke account sessions, trusted devices, secret transfers, and remote sessions.`
}

"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useLocale } from "next-intl"
import { Link } from "@/i18n/navigation"
import { CheckCircle2, KeyRound, LoaderCircle, Mail } from "lucide-react"
import { BrandMark } from "@/components/BrandMark"

type Mode = "verify" | "reset"
type Status = "idle" | "working" | "done" | "error"

/**
 * Landing page for links in verification and reset emails. The token arrives in the URL
 * fragment, which browsers never send to a server or in a Referer header; it is read once
 * and removed from the address bar.
 */
export function EmailAction({ mode }: { mode: Mode }) {
  const tr = useLocale() === "tr"
  const [token, setToken] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>("idle")
  const [message, setMessage] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")

  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get("token")
    if (!value) return
    window.history.replaceState(null, "", window.location.pathname)
    void (async () => {
      setToken(value)
      if (mode === "verify") {
        await run("/api/auth/email-verification/confirm", { token: value }, tr ? "E-posta adresiniz doğrulandı." : "Your email address is verified.")
      }
    })()
    // Runs once on load: the token is removed from the address bar right away.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function run(path: string, body: unknown, success: string) {
    setStatus("working")
    setMessage(null)
    try {
      const response = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
      const json = await response.json().catch(() => ({ ok: false })) as { ok: boolean; error?: { message?: string } }
      if (!json.ok) throw new Error(json.error?.message ?? (tr ? "İşlem tamamlanamadı." : "Could not complete the request."))
      setStatus("done")
      setMessage(success)
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : (tr ? "İşlem tamamlanamadı." : "Could not complete the request."))
    }
  }

  function submitReset(event: FormEvent) {
    event.preventDefault()
    if (!token) return
    void run("/api/auth/password-reset/confirm", { token, password }, tr ? "Parolanız değiştirildi. Tüm oturumlar kapatıldı; yeni parolanızla giriş yapın." : "Your password is changed and every session was signed out. Sign in with the new password.")
  }

  function submitRequest(event: FormEvent) {
    event.preventDefault()
    void run("/api/auth/password-reset/request", { email }, tr ? "Bu adrese kayıtlı bir hesap varsa sıfırlama bağlantısı gönderdik." : "If an account uses this address, we sent it a reset link.")
  }

  const busy = status === "working"
  const title = mode === "verify"
    ? (tr ? "E-posta doğrulama" : "Email verification")
    : (tr ? "Parolayı sıfırla" : "Reset your password")

  return (
    <div className="auth-shell">
      <div className="auth-panel marketing-card">
        <BrandMark size="auth" />
        <h1 className="marketing-title marketing-title-sm" style={{ margin: "16px 0 12px" }}>{title}</h1>

        {mode === "verify" && !token && status === "idle" && (
          <p className="marketing-lede" style={{ fontSize: 16 }}>
            {tr ? "Bu bağlantı eksik ya da geçersiz. E-postadaki bağlantıyı yeniden açın." : "This link is incomplete. Open the link from the email again."}
          </p>
        )}

        {mode === "reset" && token && status !== "done" && (
          <form onSubmit={submitReset} style={{ display: "grid", gap: 14 }}>
            <label className="auth-label">
              {tr ? "yeni parola" : "new password"}
              <span className="auth-input-wrap">
                <KeyRound aria-hidden="true" size={16} />
                <input
                  autoComplete="new-password"
                  className="auth-input"
                  maxLength={256}
                  minLength={10}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={tr ? "en az 10 karakter" : "minimum 10 characters"}
                  required
                  type="password"
                  value={password}
                />
              </span>
            </label>
            <button className="landing-button-primary mono" disabled={busy} type="submit">
              {busy && <LoaderCircle className="auth-spin" size={16} />}
              {tr ? "parolayı değiştir" : "change password"}
            </button>
          </form>
        )}

        {mode === "reset" && !token && status !== "done" && (
          <form onSubmit={submitRequest} style={{ display: "grid", gap: 14 }}>
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
            <button className="landing-button-primary mono" disabled={busy} type="submit">
              {busy && <LoaderCircle className="auth-spin" size={16} />}
              {tr ? "sıfırlama bağlantısı gönder" : "send reset link"}
            </button>
          </form>
        )}

        {(message || busy) && (
          <div
            className={`auth-device-status ${status === "done" ? "auth-device-status-approved" : status === "error" ? "auth-device-status-error" : ""}`}
            role={status === "error" ? "alert" : "status"}
            style={{ marginTop: 16 }}
          >
            {busy ? <LoaderCircle className="auth-spin" size={15} /> : status === "done" ? <CheckCircle2 size={15} /> : null}
            {message ?? (tr ? "İşleniyor..." : "Working...")}
          </div>
        )}

        {status === "done" && (
          <Link className="auth-muted-link mono" href="/login">
            {tr ? "giriş yap" : "sign in"}
          </Link>
        )}
      </div>
    </div>
  )
}

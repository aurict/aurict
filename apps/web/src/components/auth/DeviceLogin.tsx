"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useLocale } from "next-intl"
import { Link } from "@/i18n/navigation"
import { CheckCircle2, LoaderCircle, Terminal, XCircle } from "lucide-react"
import { BrandMark } from "@/components/BrandMark"
import { sanitizeNextPath } from "@/lib/auth/safe-redirect"

type DeviceStatus = "checking" | "enter" | "looking" | "ready" | "approving" | "denying" | "approved" | "denied" | "error"
type LoginRequest = {
  clientName: string
  createdAt: string
  network?: string
  country?: string
  sameNetworkAsYou: boolean
}
type User = { id: string; email: string }
type DeviceActionResponse = {
  ok: boolean
  status?: "approved" | "denied"
  clientName?: string
  expiresAt?: string
  request?: LoginRequest
  error?: { message?: string }
}

export function DeviceLogin() {
  const tr = useLocale() === "tr"
  // The code is typed by the user, never taken from the link: a link can carry a code that
  // someone else started, and approving it would sign that person's terminal into this account.
  const [codeInput, setCodeInput] = useState("")
  const [userCode, setUserCode] = useState("")
  const [request, setRequest] = useState<LoginRequest | null>(null)
  const [status, setStatus] = useState<DeviceStatus>("checking")
  const [user, setUser] = useState<User | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [clientName, setClientName] = useState("Aurict CLI")

  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      setStatus("checking")
      setMessage(null)
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" })
        const body = await response.json().catch(() => undefined)

        if (cancelled) return
        if (response.status === 401) {
          window.location.assign(nextHref("/login", currentPath()))
          return
        }
        if (!response.ok || !body?.ok) {
          throw new Error(body?.error?.message ?? (tr ? "Oturumunuz doğrulanamadı." : "Could not verify your session."))
        }

        setUser(body.user)
        setStatus("enter")
      } catch (error) {
        if (cancelled) return
        setMessage(error instanceof Error ? error.message : (tr ? "Oturumunuz doğrulanamadı." : "Could not verify your session."))
        setStatus("error")
      }
    }

    void checkSession()
    return () => {
      cancelled = true
    }
  }, [tr])

  async function lookup(event: FormEvent) {
    event.preventDefault()
    const code = normalizeUserCode(codeInput)
    if (!code || status === "looking") return
    setStatus("looking")
    setMessage(null)
    const body = await postDevice("/api/auth/device/lookup", { userCode: code }, tr)
    if (!body.ok || !body.request) {
      setMessage(body.error?.message ?? (tr ? "Bu kodla bekleyen bir giriş isteği yok." : "No pending login request has this code."))
      setStatus("enter")
      return
    }
    setUserCode(code)
    setRequest(body.request)
    setClientName(body.request.clientName)
    setStatus("ready")
  }

  async function submit(decision: "approve" | "deny") {
    if (!userCode || status === "approving" || status === "denying") return

    setStatus(decision === "approve" ? "approving" : "denying")
    setMessage(null)
    try {
      const body = await postDevice(`/api/auth/device/${decision}`, { userCode }, tr)
      if (!body.ok) throw new Error(body.error?.message ?? (tr ? `CLI girişi ${decision === "approve" ? "onaylanamadı" : "reddedilemedi"}.` : `Could not ${decision} CLI login.`))
      if (body.clientName) setClientName(body.clientName)
      setStatus(decision === "approve" ? "approved" : "denied")
      setMessage(decision === "approve" ? (tr ? "CLI girişi onaylandı." : "CLI login approved.") : (tr ? "CLI girişi reddedildi." : "CLI login denied."))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (tr ? `CLI girişi ${decision === "approve" ? "onaylanamadı" : "reddedilemedi"}.` : `Could not ${decision} CLI login.`))
      setStatus("ready")
    }
  }

  const busy = status === "checking" || status === "looking" || status === "approving" || status === "denying"
  const complete = status === "approved" || status === "denied"

  return (
    <div className="auth-shell">
      <div className="auth-panel auth-device-panel marketing-card">
        <BrandMark size="auth" />

        <div className="auth-device-icon" aria-hidden="true">
          {status === "approved" ? <CheckCircle2 size={22} /> : status === "denied" ? <XCircle size={22} /> : <Terminal size={22} />}
        </div>

        <p className="marketing-eyebrow">{tr ? "CLI tarayıcı girişi" : "CLI browser login"}</p>
        <h1 className="marketing-title marketing-title-sm" style={{ marginBottom: 12 }}>
          {tr ? "Bu terminali yetkilendirin." : "Authorize this terminal."}
        </h1>
        <p className="marketing-lede" style={{ fontSize: 16, marginBottom: 24 }}>
          {complete
            ? (tr ? "Terminalinize dönebilirsiniz." : "You can return to your terminal.")
            : (tr ? "Yalnızca kendi terminalinizde başlattığınız bir girişi onaylayın. Kodu terminalden okuyup buraya yazın." : "Only approve a login you started in your own terminal. Type the code it shows.")}
        </p>

        {(status === "enter" || status === "looking") && (
          <form onSubmit={lookup} style={{ display: "grid", gap: 14, marginBottom: 16 }}>
            <label className="auth-label">
              {tr ? "terminaldeki kod" : "code from your terminal"}
              <span className="auth-input-wrap">
                <Terminal aria-hidden="true" size={16} />
                <input
                  autoCapitalize="characters"
                  autoComplete="off"
                  autoFocus
                  className="auth-input mono"
                  maxLength={32}
                  onChange={(event) => setCodeInput(event.target.value)}
                  placeholder="ABCD-EFGH"
                  required
                  spellCheck={false}
                  value={codeInput}
                />
              </span>
            </label>
            <button className="landing-button-primary mono" disabled={busy || !codeInput.trim()} type="submit">
              {status === "looking" ? <LoaderCircle className="auth-spin" size={16} /> : null}
              {tr ? "devam" : "continue"}
            </button>
          </form>
        )}

        {userCode && (
          <div className="auth-device-code" aria-label={tr ? "CLI giriş kodu" : "CLI login code"}>
            {userCode}
          </div>
        )}

        {request && !complete && (
          <>
            <div className="auth-device-meta">
              <span>{tr ? "istemci" : "client"}</span>
              <strong>{request.clientName}</strong>
            </div>
            <div className="auth-device-meta">
              <span>{tr ? "başlatıldığı yer" : "started from"}</span>
              <strong>{[request.network, request.country].filter(Boolean).join(" · ") || (tr ? "bilinmiyor" : "unknown")}</strong>
            </div>
            <div className="auth-device-meta">
              <span>{tr ? "zaman" : "time"}</span>
              <strong>{new Date(request.createdAt).toLocaleString(tr ? "tr-TR" : "en-US")}</strong>
            </div>
            {!request.sameNetworkAsYou && (
              <div className="auth-device-status auth-device-status-error" role="alert">
                {tr
                  ? "Bu istek sizinkinden farklı bir ağdan geldi. Kendiniz başlatmadıysanız reddedin: onaylarsanız o terminal hesabınıza erişir."
                  : "This request came from a different network than yours. If you did not start it, deny it: approving gives that terminal access to your account."}
              </div>
            )}
          </>
        )}

        {user && (
          <div className="auth-device-meta">
            <span>{tr ? "giriş yapan" : "signed in as"}</span>
            <strong>{user.email}</strong>
          </div>
        )}

        <div className={`auth-device-status auth-device-status-${status}`} role={status === "error" ? "alert" : "status"}>
          {busy && <LoaderCircle className="auth-spin" size={15} />}
          {message ?? statusLabel(status, clientName, tr)}
        </div>

        {request && !complete && status !== "error" && (
          <div className="auth-device-actions">
            <button
              className="landing-button-primary mono"
              disabled={busy}
              onClick={() => submit("approve")}
              type="button"
            >
              {status === "approving" ? <LoaderCircle className="auth-spin" size={16} /> : <CheckCircle2 aria-hidden="true" size={16} />}
              {tr ? "onayla" : "approve"}
            </button>
            <button
              className="auth-danger-button mono"
              disabled={busy}
              onClick={() => submit("deny")}
              type="button"
            >
              {status === "denying" ? <LoaderCircle className="auth-spin" size={16} /> : <XCircle aria-hidden="true" size={16} />}
              {tr ? "reddet" : "deny"}
            </button>
          </div>
        )}

        {complete && (
          <Link className="auth-muted-link mono" href="/">
            {tr ? "aurict'e dön" : "back to aurict"}
          </Link>
        )}

        {status === "error" && (
          <Link className="auth-muted-link mono" href={nextHref("/login", currentPath())}>
            {tr ? "giriş yapıp tekrar deneyin" : "sign in and try again"}
          </Link>
        )}
      </div>
    </div>
  )
}

async function postDevice(path: string, body: unknown, tr: boolean) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })

  if (response.status === 401) {
    window.location.assign(nextHref("/login", currentPath()))
    return { ok: false, error: { message: tr ? "Oturumunuzun süresi doldu." : "Session expired." } } satisfies DeviceActionResponse
  }

  return response.json().catch(() => ({
    ok: false,
    error: { message: tr ? "Geçersiz sunucu yanıtı." : "Invalid server response." },
  })) as Promise<DeviceActionResponse>
}

function normalizeUserCode(value: string) {
  return value.trim().replace(/\s+/g, "").toUpperCase()
}

function currentPath() {
  return `${window.location.pathname}${window.location.search}`
}

function nextHref(path: string, nextPath: string) {
  const safeNext = sanitizeNextPath(nextPath)
  return safeNext === "/" ? path : `${path}?next=${encodeURIComponent(safeNext)}`
}

function statusLabel(status: DeviceStatus, clientName: string, tr: boolean) {
  if (status === "checking") return tr ? "Oturumunuz denetleniyor..." : "Checking your session..."
  if (status === "enter" || status === "looking") return tr ? "Terminalinizdeki kodu girin." : "Enter the code from your terminal."
  if (status === "approving") return tr ? "CLI girişi onaylanıyor..." : "Approving CLI login..."
  if (status === "denying") return tr ? "CLI girişi reddediliyor..." : "Denying CLI login..."
  if (status === "approved") return tr ? `${clientName} yetkilendirildi.` : `${clientName} is authorized.`
  if (status === "denied") return tr ? "Bu CLI giriş isteği reddedildi." : "This CLI login request was denied."
  if (status === "error") return tr ? "CLI girişine devam edilemedi." : "Could not continue CLI login."
  return tr ? "Kararınız bekleniyor." : "Waiting for your decision."
}

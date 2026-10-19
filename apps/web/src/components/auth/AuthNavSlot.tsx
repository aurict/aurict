"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { ChevronDown, LogOut, MonitorCog, UserRound } from "lucide-react"
import { Link } from "@/i18n/navigation"

type AuthUser = {
  id: string
  email: string
  createdAt: string
}

type AuthState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "user"; user: AuthUser }

export function AuthNavSlot({ drawer = false }: { drawer?: boolean }) {
  const [state, setState] = useState<AuthState>({ status: "loading" })
  const t = useTranslations("Auth")

  useEffect(() => {
    let cancelled = false
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" })
        const body = await response.json().catch(() => undefined)
        if (cancelled) return
        if (response.ok && body?.ok && body.authenticated && body.user) {
          setState({ status: "user", user: body.user as AuthUser })
        } else {
          setState({ status: "guest" })
        }
      } catch {
        if (!cancelled) setState({ status: "guest" })
      }
    }
    void loadUser()
    return () => {
      cancelled = true
    }
  }, [])

  if (state.status !== "user") {
    return drawer ? (
      <>
        <Link href="/login">{t("login")}</Link>
        <Link href="/register" style={{ color: "var(--accent)", fontWeight: 600 }}>{t("register")}</Link>
      </>
    ) : (
      <>
        <Link className="landing-nav-link" href="/login">{t("login")}</Link>
        <Link className="landing-primary-link" href="/register">{t("register")}</Link>
      </>
    )
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined)
    window.location.assign("/")
  }

  if (drawer) {
    return (
      <>
        <span className="nav-drawer-label">{t("account")}</span>
        <Link href="/console">{t("console")}</Link>
        <Link href="/console/account">{t("account")}</Link>
        <button className="nav-drawer-button" onClick={signOut} type="button">{t("signOut")}</button>
      </>
    )
  }

  return (
    <div className="nav-dropdown profile-menu">
      <button className="profile-trigger" type="button">
        <span className="profile-avatar" aria-hidden="true">{initials(state.user.email)}</span>
        <span className="profile-email">{state.user.email}</span>
        <ChevronDown aria-hidden="true" size={13} />
      </button>
      <div className="nav-dropdown-menu profile-menu-panel">
        <Link className="nav-dropdown-item profile-menu-item" href="/console">
          <MonitorCog aria-hidden="true" size={14} />
          {t("console")}
        </Link>
        <Link className="nav-dropdown-item profile-menu-item" href="/console/account">
          <UserRound aria-hidden="true" size={14} />
          {t("account")}
        </Link>
        <button className="nav-dropdown-item profile-menu-item profile-menu-button" onClick={signOut} type="button">
          <LogOut aria-hidden="true" size={14} />
          {t("signOut")}
        </button>
      </div>
    </div>
  )
}

function initials(email: string) {
  const name = email.split("@")[0] || "A"
  return name.slice(0, 2).toUpperCase()
}

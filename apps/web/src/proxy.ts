import { NextRequest, NextResponse } from "next/server"
import { DEFAULT_LOCALE, isAppLocale, type AppLocale } from "./i18n/config"

const localeCookie = "AURICT_LOCALE"

function preferredLocale(request: NextRequest): AppLocale {
  const savedLocale = request.cookies.get(localeCookie)?.value
  if (isAppLocale(savedLocale)) return savedLocale

  // Keep the unprefixed URL stable and crawlable as English. A visitor's
  // explicit choice in the locale switcher is persisted by the cookie above.
  return DEFAULT_LOCALE
}

function pathLocale(pathname: string): AppLocale | undefined {
  return isAppLocale(pathname.split("/")[1]) ? pathname.split("/")[1] as AppLocale : undefined
}

function rewriteWithLocale(request: NextRequest, pathname: string, locale: AppLocale) {
  const url = request.nextUrl.clone()
  const headers = new Headers(request.headers)
  headers.set("x-next-intl-locale", locale)
  url.pathname = pathname

  const response = NextResponse.rewrite(url, { request: { headers } })
  response.cookies.set(localeCookie, locale, { sameSite: "lax", path: "/" })
  return response
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const explicitLocale = pathLocale(pathname)

  if (explicitLocale === DEFAULT_LOCALE) {
    const url = request.nextUrl.clone()
    url.pathname = pathname === "/en" ? "/" : pathname.slice(3)
    const response = NextResponse.redirect(url)
    response.cookies.set(localeCookie, DEFAULT_LOCALE, { sameSite: "lax", path: "/" })
    return response
  }

  if (explicitLocale) {
    const prefix = `/${explicitLocale}`
    const destination = pathname === prefix ? "/" : pathname.slice(prefix.length)
    return rewriteWithLocale(request, destination, explicitLocale)
  }

  const locale = preferredLocale(request)
  if (locale !== DEFAULT_LOCALE) {
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}${pathname}`
    const response = NextResponse.redirect(url)
    response.cookies.set(localeCookie, locale, { sameSite: "lax", path: "/" })
    return response
  }

  return rewriteWithLocale(request, pathname, DEFAULT_LOCALE)
}

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
}

import type { Metadata } from "next"
import {
  DEFAULT_LOCALE,
  LOCALE_DETAILS,
  SUPPORTED_LOCALES,
  localePrefix,
  type AppLocale,
} from "./config"

const siteUrl = "https://aurict.com"
const DEFAULT_TRANSLATED_LOCALES: readonly AppLocale[] = SUPPORTED_LOCALES

type LocalizedMetadataOptions = {
  keywords?: string[]
  translatedLocales?: readonly AppLocale[]
  type?: "website" | "article"
  publishedTime?: string
  modifiedTime?: string
}

export function localizedUrl(path: string, locale: AppLocale) {
  const normalizedPath = path === "/" ? "" : path
  return `${siteUrl}${localePrefix(locale)}${normalizedPath}`
}

export function languageAlternates(path: string, locales: readonly AppLocale[] = SUPPORTED_LOCALES) {
  return Object.fromEntries([
    ...locales.map((locale) => [LOCALE_DETAILS[locale].hrefLang, localizedUrl(path, locale)]),
    ["x-default", localizedUrl(path, DEFAULT_LOCALE)],
  ])
}

export function localizedMetadata(
  locale: AppLocale,
  path: string,
  title: string,
  description: string,
  options: LocalizedMetadataOptions = {},
): Metadata {
  const translatedLocales = options.translatedLocales ?? DEFAULT_TRANSLATED_LOCALES
  const canonicalLocale = translatedLocales.includes(locale) ? locale : DEFAULT_LOCALE
  const url = localizedUrl(path, canonicalLocale)
  const openGraphType = options.type === "article"
    ? { type: "article" as const, publishedTime: options.publishedTime, modifiedTime: options.modifiedTime }
    : { type: "website" as const }

  return {
    title,
    description,
    keywords: options.keywords,
    alternates: {
      canonical: url,
      languages: languageAlternates(path, translatedLocales),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title,
      description,
      url,
      locale: LOCALE_DETAILS[canonicalLocale].openGraphLocale,
      alternateLocale: translatedLocales
        .filter((alternate) => alternate !== canonicalLocale)
        .map((alternate) => LOCALE_DETAILS[alternate].openGraphLocale),
      siteName: "Aurict",
      ...openGraphType,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  }
}

import type { Metadata } from "next"
import type { AppLocale } from "@/i18n/config"
import { localizedUrl } from "@/i18n/metadata"

export const SITE_URL = "https://aurict.com"
export const SITE_NAME = "Aurict"

type SeoOptions = {
  title: string
  description: string
  path?: string
  image?: string
  type?: "website" | "article"
  noIndex?: boolean
  publishedTime?: string
  modifiedTime?: string
}

export function absoluteUrl(path = "/") {
  if (path.startsWith("http")) return path
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

export function buildMetadata({
  title,
  description,
  path = "/",
  image = "/opengraph-image",
  type = "website",
  noIndex = false,
  publishedTime,
  modifiedTime,
}: SeoOptions): Metadata {
  const url = absoluteUrl(path)
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : {
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
      siteName: SITE_NAME,
      type,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  }
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>, locale: AppLocale = "en") {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: localizedUrl(item.path, locale),
    })),
  }
}

export function collectionJsonLd({
  name,
  description,
  path,
  items,
  locale = "en",
}: {
  name: string
  description: string
  path: string
  items: Array<{ name: string; path: string; description?: string }>
  locale?: AppLocale
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: localizedUrl(path, locale),
    inLanguage: locale,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: localizedUrl(item.path, locale),
        name: item.name,
        description: item.description,
      })),
    },
  }
}

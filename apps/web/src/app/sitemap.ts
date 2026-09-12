import type { MetadataRoute } from "next"
import { BLOG_POSTS } from "@/content/blog"
import { COMPARISONS } from "@/content/comparisons"
import { USE_CASES } from "@/content/use-cases"
import { SUPPORTED_LOCALES, type AppLocale } from "@/i18n/config"
import { languageAlternates, localizedUrl } from "@/i18n/metadata"

type SitemapRoute = {
  path: string
  lastModified: string
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
  priority: number
  locales?: readonly AppLocale[]
}

const BILINGUAL_LOCALES: readonly AppLocale[] = ["en", "tr"]

const staticRoutes: SitemapRoute[] = [
  { path: "/", lastModified: "2026-09-02", changeFrequency: "weekly", priority: 1, locales: SUPPORTED_LOCALES },
  { path: "/terminal-agent", lastModified: "2026-09-11", changeFrequency: "weekly", priority: 0.95, locales: SUPPORTED_LOCALES },
  { path: "/ai-coding-agent", lastModified: "2026-09-02", changeFrequency: "weekly", priority: 0.95 },
  { path: "/docs", lastModified: "2026-07-22", changeFrequency: "weekly", priority: 0.9 },
  { path: "/about", lastModified: "2026-07-03", changeFrequency: "monthly", priority: 0.8 },
  { path: "/roadmap", lastModified: "2026-07-03", changeFrequency: "weekly", priority: 0.8 },
  { path: "/changelog", lastModified: "2026-07-03", changeFrequency: "weekly", priority: 0.7 },
  { path: "/downloads", lastModified: "2026-07-11", changeFrequency: "weekly", priority: 0.7 },
  { path: "/blog", lastModified: "2026-07-03", changeFrequency: "weekly", priority: 0.8 },
  { path: "/compare", lastModified: "2026-09-02", changeFrequency: "monthly", priority: 0.8 },
  { path: "/use-cases", lastModified: "2026-07-03", changeFrequency: "monthly", priority: 0.8 },
  { path: "/privacy", lastModified: "2026-07-13", changeFrequency: "yearly", priority: 0.4 },
  { path: "/terms", lastModified: "2026-07-02", changeFrequency: "yearly", priority: 0.4 },
]

function localizedEntries(route: SitemapRoute): MetadataRoute.Sitemap {
  const locales = route.locales ?? BILINGUAL_LOCALES
  const alternates = languageAlternates(route.path, locales)

  return locales.map((locale) => ({
    url: localizedUrl(route.path, locale),
    lastModified: new Date(route.lastModified),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    alternates: { languages: alternates },
  }))
}

export default function sitemap(): MetadataRoute.Sitemap {
  const blogRoutes = BLOG_POSTS.flatMap((post) => localizedEntries({
    path: `/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "monthly",
    priority: 0.72,
  }))
  const comparisonRoutes = COMPARISONS.flatMap((comparison) => localizedEntries({
    path: `/compare/${comparison.slug}`,
    lastModified: "2026-09-02",
    changeFrequency: "monthly",
    priority: 0.72,
  }))
  const useCaseRoutes = USE_CASES.flatMap((useCase) => localizedEntries({
    path: `/use-cases/${useCase.slug}`,
    lastModified: useCase.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  return [
    ...staticRoutes.flatMap(localizedEntries),
    ...blogRoutes,
    ...comparisonRoutes,
    ...useCaseRoutes,
  ]
}

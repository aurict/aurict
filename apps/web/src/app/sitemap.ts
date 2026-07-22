import type { MetadataRoute } from "next"
import { BLOG_POSTS } from "@/content/blog"
import { COMPARISONS } from "@/content/comparisons"
import { USE_CASES } from "@/content/use-cases"
import { absoluteUrl } from "@/lib/seo"

type StaticRoute = {
  path: string
  lastModified: string
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
  priority: number
}

const staticRoutes: StaticRoute[] = [
  { path: "/", lastModified: "2026-07-22", changeFrequency: "weekly", priority: 1 },
  { path: "/docs", lastModified: "2026-07-22", changeFrequency: "weekly", priority: 0.9 },
  { path: "/about", lastModified: "2026-07-03", changeFrequency: "monthly", priority: 0.8 },
  { path: "/roadmap", lastModified: "2026-07-03", changeFrequency: "weekly", priority: 0.8 },
  { path: "/changelog", lastModified: "2026-07-03", changeFrequency: "weekly", priority: 0.7 },
  { path: "/downloads", lastModified: "2026-07-11", changeFrequency: "weekly", priority: 0.7 },
  { path: "/blog", lastModified: "2026-07-03", changeFrequency: "weekly", priority: 0.8 },
  { path: "/compare", lastModified: "2026-07-22", changeFrequency: "monthly", priority: 0.8 },
  { path: "/use-cases", lastModified: "2026-07-03", changeFrequency: "monthly", priority: 0.8 },
  { path: "/privacy", lastModified: "2026-07-03", changeFrequency: "yearly", priority: 0.4 },
  { path: "/terms", lastModified: "2026-07-03", changeFrequency: "yearly", priority: 0.4 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...staticRoutes.flatMap((route) => {
      const englishUrl = absoluteUrl(route.path)
      const turkishUrl = absoluteUrl(`/tr${route.path === "/" ? "" : route.path}`)

      return [
        {
          url: englishUrl,
          lastModified: new Date(route.lastModified),
          changeFrequency: route.changeFrequency,
          priority: route.priority,
          alternates: { languages: { en: englishUrl, tr: turkishUrl, "x-default": englishUrl } },
        },
        {
          url: turkishUrl,
          lastModified: new Date(route.lastModified),
          changeFrequency: route.changeFrequency,
          priority: route.priority,
          alternates: { languages: { en: englishUrl, tr: turkishUrl, "x-default": englishUrl } },
        },
      ]
    }),
    ...BLOG_POSTS.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.72,
    })),
    ...COMPARISONS.map((comparison) => ({
      url: absoluteUrl(`/compare/${comparison.slug}`),
      lastModified: new Date(comparison.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.72,
    })),
    ...USE_CASES.map((useCase) => ({
      url: absoluteUrl(`/use-cases/${useCase.slug}`),
      lastModified: new Date(useCase.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ]
}

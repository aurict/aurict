import type { MetadataRoute } from "next"

const BASE = "https://aurict.dev"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url:             BASE,
      lastModified:    new Date("2026-06-09"),
      changeFrequency: "weekly",
      priority:        1.0,
    },
    {
      url:             `${BASE}/docs`,
      lastModified:    new Date("2026-06-09"),
      changeFrequency: "weekly",
      priority:        0.9,
    },
    {
      url:             `${BASE}/changelog`,
      lastModified:    new Date("2026-06-09"),
      changeFrequency: "weekly",
      priority:        0.7,
    },
  ]
}
